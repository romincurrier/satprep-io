import { supabase } from './supabase.js';

const esc = (value) => String(value ?? '').replace(/[&<>\"]/g, (match) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}[match]));

let rendering = false;

async function context() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,email,first_name,last_name,role')
    .eq('id', session.user.id)
    .maybeSingle();
  return profile?.role === 'admin' ? { session, profile } : null;
}

async function authedPost(url, body = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in again.');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

async function load() {
  return authedPost('/api/admin-overview');
}

function statusBadge(value) {
  const good = ['active', 'trialing', 'completed'].includes(value);
  return `<span class="badge ${good ? 'good' : 'warn'}">${esc(value || '—')}</span>`;
}

async function render() {
  if (rendering) return;
  const params = new URLSearchParams(location.search);
  if (params.get('app') !== '1' || params.get('openBilling') === '1') return;

  const ctx = await context();
  if (!ctx) return;
  const main = document.querySelector('main');
  if (!main || document.querySelector('#adminOpsDashboard')) return;

  rendering = true;
  try {
    let data;
    try {
      data = await load();
    } catch (error) {
      main.id = 'adminOpsDashboard';
      main.className = 'wrap';
      main.innerHTML = `<section class="hero"><div class="eyebrow">ADMINISTRATOR</div><h1>SATprep.io Operations</h1><p>Monitor commercial readiness and account operations from one place.</p></section><div class="error">Administrator data is temporarily unavailable. ${esc(error.message || '')}</div><button class="btn secondary" id="adminRefresh">Try again</button>`;
      document.querySelector('#adminRefresh')?.addEventListener('click', () => {
        main.removeAttribute('id');
        render();
      });
      return;
    }

    const counts = data.counts || {};
    const households = data.recent_households || [];
    const students = data.recent_students || [];

    main.id = 'adminOpsDashboard';
    main.className = 'wrap';
    main.innerHTML = `<section class="hero">
      <div class="row" style="align-items:flex-start">
        <div><div class="eyebrow">ADMINISTRATOR</div><h1>SATprep.io Operations</h1><p>Monitor accounts, subscriptions, student activation and diagnostic progress from one place.</p></div>
        <button class="btn secondary" id="adminRefresh">Refresh</button>
      </div>
    </section>
    <section class="grid">
      <div class="card c3"><div class="label">Households</div><div class="metric">${counts.households ?? '—'}</div></div>
      <div class="card c3"><div class="label">Parents</div><div class="metric">${counts.parents ?? '—'}</div></div>
      <div class="card c3"><div class="label">Students</div><div class="metric">${counts.students ?? '—'}</div></div>
      <div class="card c3"><div class="label">Active trials/plans</div><div class="metric">${counts.active_subscriptions ?? '—'}</div></div>
      <div class="card c6">
        <h2>Student activation</h2>
        <div class="lesson"><span>Login activated</span><strong>${counts.linked_students ?? '—'}</strong></div>
        <div class="lesson"><span>Waiting for login activation</span><strong>${counts.waiting_for_login ?? '—'}</strong></div>
        <div class="lesson"><span>Diagnostics complete</span><strong>${counts.completed_diagnostics ?? '—'}</strong></div>
      </div>
      <div class="card c6">
        <h2>System readiness</h2>
        <div class="lesson"><span>Active billing records</span><strong>${counts.active_subscriptions ?? '—'}</strong></div>
        <div class="lesson"><span>Student auth profiles</span><strong>${counts.student_auth_profiles ?? '—'}</strong></div>
        <div class="lesson"><span>Operations data path</span><strong>Server mediated</strong></div>
      </div>
      <div class="card c12">
        <h2>Recent households</h2>
        ${households.length ? households.map((household) => `<div class="lesson"><div><strong>${esc(household.name || 'Household')}</strong><div class="small">${household.student_count || 0} student${household.student_count === 1 ? '' : 's'} · limit ${household.student_limit ?? '—'} ${household.is_test_household ? '· test household' : ''}</div></div><div class="right">${statusBadge(household.subscription_status)} <span class="small">${esc(household.plan_key || 'no plan')}</span></div></div>`).join('') : '<p class="muted">No households yet.</p>'}
      </div>
      <div class="card c12">
        <h2>Recent students</h2>
        ${students.length ? students.map((student) => `<div class="lesson"><div><strong>${esc(student.display_name || 'Student')}</strong><div class="small">Grade ${student.grade_level || '—'} · ${esc(student.target_exam || 'PSAT')} · ${student.login_active ? 'login active' : 'login not activated'}</div></div><div class="right">${student.diagnostic_complete ? '<span class="badge good">Diagnostic complete</span>' : '<span class="badge warn">Diagnostic pending</span>'}</div></div>`).join('') : '<p class="muted">No students yet.</p>'}
      </div>
    </section>`;

    document.querySelector('#adminRefresh')?.addEventListener('click', () => {
      main.removeAttribute('id');
      render();
    });
  } finally {
    rendering = false;
  }
}

const observer = new MutationObserver(() => setTimeout(render, 0));
observer.observe(document.documentElement, { childList: true, subtree: true });
setTimeout(render, 200);
supabase.auth.onAuthStateChange(() => setTimeout(render, 200));
