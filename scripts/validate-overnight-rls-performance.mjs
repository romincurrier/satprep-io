import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const testTables = read('migrations/20260828_test_tables_admin_rls_initplan.sql');
const subscriptions = read('migrations/20260828_subscriptions_read_rls_initplan.sql');
const journeyEvents = read('migrations/20260828_journey_events_read_rls_initplan.sql');
const studentAchievements = read('migrations/20260828_student_achievements_read_rls_initplan.sql');
const studentMissions = read('migrations/20260828_student_missions_read_rls_initplan.sql');

for (const [label, migration] of [['test-telemetry', testTables], ['subscriptions', subscriptions], ['journey-events', journeyEvents], ['student-achievements', studentAchievements], ['student-missions', studentMissions]]) {
  assert.match(migration, /\(select auth\.uid\(\)\)/i, `${label} optimization must cache auth.uid() through an InitPlan.`);
  assert.doesNotMatch(migration, /\bto\s+(authenticated|anon|public|service_role)\b/i, `${label} InitPlan migration must not change policy role targets.`);
  assert.doesNotMatch(migration, /drop\s+policy|create\s+policy/i, `${label} InitPlan migration must alter existing policies rather than replacing them.`);
  assert.doesNotMatch(migration, /grant\s|revoke\s/i, `${label} InitPlan migration must not alter privileges.`);
}

for (const policy of ['admin_test_runs_all', 'admin_test_events_all']) {
  assert.match(testTables, new RegExp(`alter policy ["']?${policy}["']?`, 'i'), `${policy} must remain explicitly covered by the test-telemetry InitPlan migration.`);
}
assert.equal((testTables.match(/alter policy/gi) || []).length, 2, 'Test-telemetry tranche must alter exactly two policies.');
assert.doesNotMatch(testTables, /\bfor\s+(select|insert|update|delete)\b/i, 'Test-telemetry policies must preserve their existing ALL commands.');
for (const policy of ['admin_test_runs_all', 'admin_test_events_all']) {
  const block = new RegExp(`${policy}[\\s\\S]*?using[\\s\\S]*?p\\.id = \\(select auth\\.uid\\(\\)\\)[\\s\\S]*?p\\.role = 'admin'[\\s\\S]*?with check[\\s\\S]*?p\\.id = \\(select auth\\.uid\\(\\)\\)[\\s\\S]*?p\\.role = 'admin'`, 'i');
  assert.match(testTables, block, `${policy} must preserve the profile-backed administrator predicate in USING and WITH CHECK.`);
}

for (const policy of ['subscription_self_read', 'subscription_household_billing_owner_read']) {
  assert.match(subscriptions, new RegExp(`alter policy ["']?${policy}["']?`, 'i'), `${policy} must remain explicitly covered by the subscription-reader InitPlan migration.`);
}
assert.equal((subscriptions.match(/alter policy/gi) || []).length, 2, 'Subscription reader tranche must alter exactly two policies.');
assert.doesNotMatch(subscriptions, /alter\s+policy\s+["']?subscription_admin_all["']?/i, 'Subscription reader tranche must leave the separate administrator policy untouched.');
assert.doesNotMatch(subscriptions, /\bfor\s+(insert|update|delete)\b|with\s+check/i, 'Subscription reader tranche must remain read-only and must not introduce write predicates.');
assert.match(subscriptions, /subscription_self_read[\s\S]*profile_id = \(select auth\.uid\(\)\)/i, 'Subscription self-read must remain profile-self scoped.');
assert.match(subscriptions, /subscription_household_billing_owner_read[\s\S]*household_id is not null[\s\S]*p\.id = \(select auth\.uid\(\)\)[\s\S]*p\.household_id = subscriptions\.household_id[\s\S]*p\.billing_owner = true/i, 'Household subscription reads must preserve non-null household, same-household, and billing-owner scope.');

for (const policy of ['journey_event_parent_read', 'journey_event_student_read']) {
  assert.match(journeyEvents, new RegExp(`alter policy ["']?${policy}["']?`, 'i'), `${policy} must remain explicitly covered by the journey-event InitPlan migration.`);
}
assert.equal((journeyEvents.match(/alter policy/gi) || []).length, 2, 'Journey-event tranche must alter exactly two reader policies.');
assert.doesNotMatch(journeyEvents, /alter\s+policy\s+["']?journey_event_admin_all["']?/i, 'Journey-event read tranche must leave the separate administrator policy untouched.');
assert.doesNotMatch(journeyEvents, /\bfor\s+(insert|update|delete)\b|with\s+check/i, 'Journey-event tranche must remain read-only and must not introduce write predicates.');
assert.match(journeyEvents, /journey_event_parent_read[\s\S]*from public\.parent_students ps[\s\S]*ps\.student_id = journey_events\.student_id[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)/i, 'Journey-event parent reads must preserve linked-parent scope.');
assert.match(journeyEvents, /journey_event_student_read[\s\S]*from public\.students s[\s\S]*s\.id = journey_events\.student_id[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)/i, 'Journey-event student reads must preserve learner-self scope.');

for (const policy of ['achievement_parent_read', 'achievement_student_read']) {
  assert.match(studentAchievements, new RegExp(`alter policy ["']?${policy}["']?`, 'i'), `${policy} must remain explicitly covered by the student-achievement InitPlan migration.`);
}
assert.equal((studentAchievements.match(/alter policy/gi) || []).length, 2, 'Student-achievement tranche must alter exactly two reader policies.');
assert.doesNotMatch(studentAchievements, /alter\s+policy\s+["']?achievement_admin_all["']?/i, 'Student-achievement read tranche must leave the separate administrator policy untouched.');
assert.doesNotMatch(studentAchievements, /alter\s+policy\s+["']?achievement_student_insert["']?/i, 'Student-achievement read tranche must leave the authenticated student INSERT policy untouched.');
assert.doesNotMatch(studentAchievements, /\bfor\s+(insert|update|delete)\b|with\s+check/i, 'Student-achievement tranche must remain read-only and must not introduce write predicates.');
assert.match(studentAchievements, /achievement_parent_read[\s\S]*from public\.parent_students ps[\s\S]*ps\.student_id = student_achievements\.student_id[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)/i, 'Student-achievement parent reads must preserve linked-parent scope.');
assert.match(studentAchievements, /achievement_student_read[\s\S]*from public\.students s[\s\S]*s\.id = student_achievements\.student_id[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)/i, 'Student-achievement student reads must preserve learner-self scope.');

for (const policy of ['mission_parent_read', 'mission_student_read']) {
  assert.match(studentMissions, new RegExp(`alter policy ["']?${policy}["']?`, 'i'), `${policy} must remain explicitly covered by the student-missions InitPlan migration.`);
}
assert.equal((studentMissions.match(/alter policy/gi) || []).length, 2, 'Student-missions tranche must alter exactly two reader policies.');
assert.doesNotMatch(studentMissions, /alter\s+policy\s+["']?mission_admin_all["']?/i, 'Student-missions read tranche must leave the separate administrator policy untouched.');
assert.doesNotMatch(studentMissions, /alter\s+policy\s+["']?mission_student_(insert|update)["']?/i, 'Student-missions read tranche must leave authenticated student write policies untouched.');
assert.doesNotMatch(studentMissions, /\bfor\s+(insert|update|delete)\b|with\s+check/i, 'Student-missions tranche must remain read-only and must not introduce write predicates.');
assert.match(studentMissions, /mission_parent_read[\s\S]*from public\.parent_students ps[\s\S]*ps\.student_id = student_missions\.student_id[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)/i, 'Student-missions parent reads must preserve linked-parent scope.');
assert.match(studentMissions, /mission_student_read[\s\S]*from public\.students s[\s\S]*s\.id = student_missions\.student_id[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)/i, 'Student-missions student reads must preserve learner-self scope.');

console.log('Overnight test-telemetry, subscription, journey-event, student-achievement, and student-missions RLS InitPlan boundary checks passed.');
