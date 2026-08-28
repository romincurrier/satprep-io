import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../migrations/20260828_households_rls_initplan.sql', import.meta.url), 'utf8');

for (const policy of ['admin_household_all', 'household_member_read']) {
  assert.match(migration, new RegExp(`alter policy ["']${policy}["']`, 'i'), `${policy} must remain explicitly covered by the household InitPlan migration.`);
}

assert.match(migration, /\(select auth\.uid\(\)\)/i, 'Household optimization must cache auth.uid() through an InitPlan.');
assert.doesNotMatch(migration, /\bto\s+(authenticated|anon|public|service_role)\b/i, 'Household InitPlan migration must not change policy role targets.');
assert.doesNotMatch(migration, /drop\s+policy|create\s+policy/i, 'Household InitPlan migration must alter existing policies rather than replacing or consolidating them.');
assert.doesNotMatch(migration, /grant\s|revoke\s/i, 'Household InitPlan migration must not alter privileges.');
assert.doesNotMatch(migration, /\bfor\s+(select|insert|update|delete)\b/i, 'Household InitPlan migration must preserve the existing ALL and SELECT commands.');

assert.match(
  migration,
  /admin_household_all[\s\S]*using[\s\S]*p\.id = \(select auth\.uid\(\)\)[\s\S]*p\.role = 'admin'::text[\s\S]*with check[\s\S]*p\.id = \(select auth\.uid\(\)\)[\s\S]*p\.role = 'admin'::text/i,
  'admin_household_all must preserve the same profile-backed administrator predicate in USING and WITH CHECK.'
);

assert.match(
  migration,
  /household_member_read[\s\S]*p\.household_id = households\.id[\s\S]*p\.id = \(select auth\.uid\(\)\)[\s\S]*\bor\b[\s\S]*p\.id = \(select auth\.uid\(\)\)[\s\S]*p\.role = 'admin'::text/i,
  'household_member_read must preserve household membership OR administrator access.'
);

assert.equal((migration.match(/alter policy/gi) || []).length, 2, 'Household InitPlan tranche must alter exactly the two intended policies.');

console.log('Household RLS InitPlan boundary checks passed.');
