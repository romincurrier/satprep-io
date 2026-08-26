import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const tranche1=read('migrations/20260826_rls_initplan_self_policy_optimization.sql');
const tranche2=read('migrations/20260826_rls_initplan_parent_read_optimization.sql');

for(const policy of ['profile_self_read','profile_self_update','student_self_read','student_self_update']){
 assert.match(tranche1,new RegExp(`alter policy ["']${policy}["']`,'i'),`${policy} must remain explicitly covered by the self-policy InitPlan migration.`);
}
for(const policy of ['parent_link_read','parent_household_student_read2','parent_linked_student_read']){
 assert.match(tranche2,new RegExp(`alter policy ["']${policy}["']`,'i'),`${policy} must remain explicitly covered by the parent-read InitPlan migration.`);
}
for(const [label,migration] of [['self-policy',tranche1],['parent-read',tranche2]]){
 assert.match(migration,/\(select auth\.uid\(\)\)/i,`${label} optimization must cache auth.uid() through an InitPlan.`);
 assert.doesNotMatch(migration,/\bto\s+(authenticated|anon|public|service_role)\b/i,`${label} InitPlan-only migration must not change policy role targets.`);
 assert.doesNotMatch(migration,/drop\s+policy|create\s+policy/i,`${label} InitPlan-only migration must alter existing policies rather than replacing them.`);
 assert.doesNotMatch(migration,/grant\s|revoke\s/i,`${label} InitPlan-only migration must not alter table or role privileges.`);
}
assert.doesNotMatch(tranche1,/with\s+check/i,'Self-policy optimization must not introduce a new WITH CHECK predicate when the existing policies did not have one.');
assert.match(tranche1,/using \(\(select auth\.uid\(\)\) = id\)/i,'Profile self policies must preserve uid=id semantics.');
assert.match(tranche1,/using \(profile_id = \(select auth\.uid\(\)\)\)/i,'Student self policies must preserve profile_id=uid semantics.');
assert.match(tranche2,/parent_profile_id = \(select auth\.uid\(\)\)/i,'Parent link reads must preserve parent_profile_id=uid semantics.');
assert.match(tranche2,/p\.id = \(select auth\.uid\(\)\)[\s\S]*p\.role = 'parent'[\s\S]*p\.household_id = students\.household_id/i,'Household student reads must preserve the parent-role and household-match predicates.');
assert.match(tranche2,/ps\.student_id = students\.id[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)/i,'Explicit parent-student link reads must preserve the linked-student predicate.');

console.log('RLS InitPlan performance-boundary checks passed.');
