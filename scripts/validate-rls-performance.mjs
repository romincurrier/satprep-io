import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const tranche1=read('migrations/20260826_rls_initplan_self_policy_optimization.sql');

for(const policy of ['profile_self_read','profile_self_update','student_self_read','student_self_update']){
 assert.match(tranche1,new RegExp(`alter policy ["']${policy}["']`,'i'),`${policy} must remain explicitly covered by the self-policy InitPlan migration.`);
}
assert.match(tranche1,/\(select auth\.uid\(\)\)/i,'Self-policy optimization must cache auth.uid() through an InitPlan.');
assert.doesNotMatch(tranche1,/\bto\s+(authenticated|anon|public|service_role)\b/i,'InitPlan-only migration must not change policy role targets.');
assert.doesNotMatch(tranche1,/drop\s+policy|create\s+policy/i,'InitPlan-only migration must alter existing policies rather than replacing them.');
assert.doesNotMatch(tranche1,/grant\s|revoke\s/i,'InitPlan-only migration must not alter table or role privileges.');
assert.doesNotMatch(tranche1,/with\s+check/i,'Self-policy optimization must not introduce a new WITH CHECK predicate when the existing policies did not have one.');
assert.match(tranche1,/using \(\(select auth\.uid\(\)\) = id\)/i,'Profile self policies must preserve uid=id semantics.');
assert.match(tranche1,/using \(profile_id = \(select auth\.uid\(\)\)\)/i,'Student self policies must preserve profile_id=uid semantics.');

console.log('RLS InitPlan performance-boundary checks passed.');
