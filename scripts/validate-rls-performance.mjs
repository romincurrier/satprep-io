import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const tranche1=read('migrations/20260826_rls_initplan_self_policy_optimization.sql');
const tranche2=read('migrations/20260826_rls_initplan_parent_read_optimization.sql');
const priorAssessmentTranche=read('migrations/20260826_prior_assessments_rls_initplan.sql');
const privacyRequestTranche=read('migrations/20260826_privacy_requests_rls_initplan.sql');
const adminHelper=read('migrations/20260826_private_admin_rls_helper.sql');

for(const policy of ['profile_self_read','profile_self_update','student_self_read','student_self_update']){
 assert.match(tranche1,new RegExp(`alter policy ["']${policy}["']`,'i'),`${policy} must remain explicitly covered by the self-policy InitPlan migration.`);
}
for(const policy of ['parent_link_read','parent_household_student_read2','parent_linked_student_read']){
 assert.match(tranche2,new RegExp(`alter policy ["']${policy}["']`,'i'),`${policy} must remain explicitly covered by the parent-read InitPlan migration.`);
}
const priorAssessmentPolicies=[
 'prior_assessment_student_read','prior_assessment_student_insert','prior_assessment_parent_read',
 'prior_assessment_parent_insert','prior_assessment_student_update','prior_assessment_parent_update'
];
for(const policy of priorAssessmentPolicies){
 assert.match(priorAssessmentTranche,new RegExp(`alter policy ["']${policy}["']`,'i'),`${policy} must remain explicitly covered by the prior-assessment InitPlan migration.`);
}
const privacyRequestPolicies=['privacy_request_admin_read','privacy_request_self_insert','privacy_request_self_read'];
for(const policy of privacyRequestPolicies){
 assert.match(privacyRequestTranche,new RegExp(`alter policy ["']${policy}["']`,'i'),`${policy} must remain explicitly covered by the privacy-request InitPlan migration.`);
}
for(const [label,migration] of [['self-policy',tranche1],['parent-read',tranche2],['prior-assessment',priorAssessmentTranche],['privacy-request',privacyRequestTranche]]){
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
assert.match(priorAssessmentTranche,/prior_assessment_student_insert[\s\S]*created_by = \(select auth\.uid\(\)\)[\s\S]*s\.id = prior_assessments\.student_id[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)/i,'Prior-assessment student inserts must preserve uploader=self and student ownership predicates.');
assert.match(priorAssessmentTranche,/prior_assessment_parent_insert[\s\S]*created_by = \(select auth\.uid\(\)\)[\s\S]*ps\.student_id = prior_assessments\.student_id[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)/i,'Prior-assessment parent inserts must preserve uploader=self and explicit parent-link predicates.');
assert.match(priorAssessmentTranche,/prior_assessment_student_update[\s\S]*using[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)[\s\S]*with check[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)/i,'Prior-assessment student updates must preserve ownership in both USING and WITH CHECK.');
assert.match(priorAssessmentTranche,/prior_assessment_parent_update[\s\S]*using[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)[\s\S]*with check[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)/i,'Prior-assessment parent updates must preserve link scope in both USING and WITH CHECK.');
assert.match(privacyRequestTranche,/privacy_request_admin_read[\s\S]*p\.id = \(select auth\.uid\(\)\)[\s\S]*p\.role = 'admin'/i,'Privacy-request admin reads must preserve the profile-backed admin predicate.');
assert.match(privacyRequestTranche,/privacy_request_self_insert[\s\S]*requester_profile_id = \(select auth\.uid\(\)\)[\s\S]*handled_by_profile_id is null[\s\S]*verified_at is null[\s\S]*completed_at is null[\s\S]*status = 'submitted'/i,'Privacy-request inserts must preserve requester ownership and immutable submitted-state predicates.');
assert.match(privacyRequestTranche,/privacy_request_self_insert[\s\S]*s\.id = privacy_requests\.target_student_id[\s\S]*s\.profile_id = \(select auth\.uid\(\)\)[\s\S]*ps\.student_id = privacy_requests\.target_student_id[\s\S]*ps\.parent_profile_id = \(select auth\.uid\(\)\)/i,'Privacy-request inserts must preserve self-student and linked-parent target scope.');
assert.match(privacyRequestTranche,/privacy_request_self_read[\s\S]*requester_profile_id = \(select auth\.uid\(\)\)/i,'Privacy-request self reads must remain requester scoped.');

const adminPolicies=[
 'diagnostic_admin_all','diagnostic_response_admin_all','journey_event_admin_all','lesson_admin_read',
 'reward_admin_all','parent_link_admin_all','prior_assessment_admin_all','profile_admin_read',
 'profile_admin_update','attempt_admin_read','skill_admin_read','achievement_admin_all',
 'journey_admin_all','mission_admin_all','skill_evidence_admin_all','student_admin_all',
 'subscription_admin_all','weekly_goal_admin_all','assessment_reports_admin_read'
];
for(const policy of adminPolicies){
 assert.match(adminHelper,new RegExp(`alter\\s+policy\\s+${policy}\\b[\\s\\S]*?using\\s*\\([^;]*?select\\s+private\\.is_admin\\(\\)`,'i'),`${policy} must use the private admin helper through an InitPlan.`);
}
assert.match(adminHelper,/create schema if not exists private/i,'Admin helper must live in a private schema.');
assert.match(adminHelper,/security definer[\s\S]*set search_path\s*=\s*''/i,'Private admin helper must pin an empty search_path.');
assert.match(adminHelper,/where id = \(select auth\.uid\(\)\)[\s\S]*role = 'admin'/i,'Private admin helper must preserve the profile-backed admin predicate and cache auth.uid().');
assert.match(adminHelper,/revoke all on schema private from public, anon/i,'Private schema must not be generally usable by public/anonymous roles.');
assert.match(adminHelper,/revoke all on function private\.is_admin\(\) from public, anon, authenticated, service_role/i,'Private admin helper must reset default execute privileges before granting the minimum roles.');
assert.match(adminHelper,/grant execute on function private\.is_admin\(\) to authenticated, service_role/i,'Authenticated policy evaluation and trusted service operations must retain helper execution.');
assert.doesNotMatch(adminHelper,/grant execute on function private\.is_admin\(\) to[^;]*\banon\b/i,'Anonymous callers must not gain helper execution.');
assert.match(adminHelper,/drop function public\.is_admin\(\)/i,'The exposed public SECURITY DEFINER helper must be removed after all policy rewrites.');
assert.doesNotMatch(adminHelper,/drop\s+policy|create\s+policy/i,'Admin-helper hardening must alter existing policies rather than replacing them.');
assert.doesNotMatch(adminHelper,/grant\s+(select|insert|update|delete|all)\s+on\s+(table\s+)?(public|storage)\./i,'Admin-helper hardening must not broaden table privileges.');

console.log('RLS InitPlan and private-admin-helper boundary checks passed.');
