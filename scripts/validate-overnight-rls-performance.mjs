import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const testTables = read('migrations/20260828_test_tables_admin_rls_initplan.sql');
const subscriptions = read('migrations/20260828_subscriptions_read_rls_initplan.sql');

for (const [label, migration] of [['test-telemetry', testTables], ['subscriptions', subscriptions]]) {
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

console.log('Overnight test-telemetry and subscription RLS InitPlan boundary checks passed.');
