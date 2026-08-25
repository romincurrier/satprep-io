import { authenticatedUser, enforceRateLimit, json, service } from '../server/supabase-server.js';

async function adminContext(req) {
  const auth = await authenticatedUser(req);
  if (!auth?.user) return null;
  const rows = await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role&limit=1`);
  const profile = rows?.[0];
  return profile?.role === 'admin' ? { ...auth, profile } : null;
}

function recent(rows, count) {
  return (rows || []).slice(0, count);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const ctx = await adminContext(req);
    if (!ctx) return json(res, 401, { error: 'Administrator access is required.' });
    await enforceRateLimit(ctx.user.id, 'admin/overview', { limit: 30, windowSeconds: 60 });

    const [profiles, students, households, subscriptions, diagnostics] = await Promise.all([
      service('/rest/v1/profiles?select=role'),
      service('/rest/v1/students?select=id,profile_id,display_name,first_name,last_name,grade_level,target_exam,household_id,diagnostic_completed_at,created_at&order=created_at.desc'),
      service('/rest/v1/households?select=id,name,plan_key,student_limit,is_test_household,created_at&order=created_at.desc'),
      service('/rest/v1/subscriptions?select=household_id,plan_key,status&order=created_at.desc'),
      service('/rest/v1/diagnostic_attempts?status=eq.completed&select=student_id,status,completed_at&order=completed_at.desc')
    ]);

    const parentCount = (profiles || []).filter((profile) => profile.role === 'parent').length;
    const studentProfileCount = (profiles || []).filter((profile) => profile.role === 'student').length;
    const activeSubscriptionCount = (subscriptions || []).filter((subscription) => ['active', 'trialing'].includes(subscription.status)).length;
    const completedDiagnosticStudents = new Set((diagnostics || []).map((attempt) => attempt.student_id));
    const linkedStudentCount = (students || []).filter((student) => student.profile_id).length;

    const studentCounts = new Map();
    for (const student of students || []) {
      studentCounts.set(student.household_id, (studentCounts.get(student.household_id) || 0) + 1);
    }
    const subscriptionByHousehold = new Map();
    for (const subscription of subscriptions || []) {
      if (!subscriptionByHousehold.has(subscription.household_id)) subscriptionByHousehold.set(subscription.household_id, subscription);
    }

    const recentHouseholds = recent(households, 10).map((household) => {
      const subscription = subscriptionByHousehold.get(household.id);
      return {
        id: household.id,
        name: household.name,
        plan_key: subscription?.plan_key || household.plan_key || null,
        subscription_status: subscription?.status || null,
        student_count: studentCounts.get(household.id) || 0,
        student_limit: household.student_limit,
        is_test_household: !!household.is_test_household
      };
    });

    const recentStudents = recent(students, 12).map((student) => ({
      id: student.id,
      display_name: student.display_name || [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Student',
      grade_level: student.grade_level,
      target_exam: student.target_exam,
      login_active: !!student.profile_id,
      diagnostic_complete: completedDiagnosticStudents.has(student.id) || !!student.diagnostic_completed_at
    }));

    return json(res, 200, {
      ok: true,
      counts: {
        households: (households || []).length,
        parents: parentCount,
        students: (students || []).length,
        active_subscriptions: activeSubscriptionCount,
        linked_students: linkedStudentCount,
        waiting_for_login: Math.max(0, (students || []).length - linkedStudentCount),
        completed_diagnostics: completedDiagnosticStudents.size,
        student_auth_profiles: studentProfileCount
      },
      recent_households: recentHouseholds,
      recent_students: recentStudents
    });
  } catch (error) {
    console.error('admin-overview', error?.message || error);
    if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
    const status = Number(error.status);
    return json(res, status && status >= 400 && status < 600 ? status : 500, {
      error: status && status < 500 ? error.message : status === 503 ? error.message : 'Unable to load administrator operations right now.'
    });
  }
}
