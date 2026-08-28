import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../migrations/20260828_student_journey_read_rls_initplan.sql', import.meta.url), 'utf8');

assert.match(migration, /\(select auth\.uid\(\)\)/i, 'Student-journey read optimization must cache auth.uid() through an InitPlan.');
assert.equal((migration.match(/alter policy/gi) || []).length, 2, 'Student-journey tranche must alter exactly two reader policies.');
for (const policy of ['journey_parent_read', 'journey_student_read']) {
  assert.match(migration, new RegExp(`alter policy ["']?${policy}["']?`, 'i'), `${policy} must remain explicitly covered.`);
}
assert.doesNotMatch(migration, /alter\s+policy\s+["']?journey_admin_all["']?/i, 'Student-journey read tranche must leave the administrator ALL policy untouched.');
assert.doesNotMatch(migration, /alter\s+policy\s+["']?journey_student_(insert|update)["']?/i, 'Student-journey read tranche must leave authenticated student write policies untouched.');
assert.doesNotMatch(migration, /\bto\s+(authenticated|anon|public|service_role)\b/i, 'Student-journey InitPlan migration must not change policy role targets.');
assert.doesNotMatch(migration, /drop\s+policy|create\s+policy/i, 'Student-journey InitPlan migration must alter existing policies rather than replacing them.');
assert.doesNotMatch(migration, /grant\s|revoke\s/i, 'Student-journey InitPlan migration must not alter privileges.');
assert.doesNotMatch(migration, /\bfor\s+(insert|update|delete)\b|with\s+check/i, 'Student-journey tranche must remain read-only and must not introduce write predicates.');
assert.match(migration, /journey_parent_read[\s\S]*from public\.parent_students ps[\s\S]*ps\.student_id = student_journey\.student_id[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)/i, 'Student-journey parent reads must preserve linked-parent scope.');
assert.match(migration, /journey_student_read[\s\S]*from public\.students s[\s\S]*s\.id = student_journey\.student_id[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)/i, 'Student-journey student reads must preserve learner-self scope.');

console.log('Student-journey read RLS InitPlan boundary checks passed.');
