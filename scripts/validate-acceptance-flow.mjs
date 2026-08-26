import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const has=(text,needle,message)=>assert.ok(text.includes(needle),message);

const onboarding=read('onboarding.js');
const billing=read('billing.js');
const parentDashboard=read('parent-dashboard.js');
const prior=read('prior-assessments-v3.js');
const diagnostic=read('diagnostic-router.js');
const learningModel=read('learning-model.js');
const practice=read('learning-v2.js');
const journey=read('journey.js');
const admin=read('admin-dashboard.js');
const parentStudent=read('api/parent-student.js');
const activation=read('api/activate-student-login.js');
const parentInvitations=read('api/parent-invitations.js');
const parentProgress=read('api/parent-progress.js');
const adminOverview=read('api/admin-overview.js');
const diagnosticSession=read('api/diagnostic-session-v3.js');
const diagnosticAnswer=read('api/diagnostic-answer-v3.js');
const practiceSession=read('api/practice-session-v3.js');
const practiceAnswer=read('api/practice-answer-v3.js');
const invitationMigration=read('migrations/20260826_atomic_parent_invitation_acceptance.sql');
const gates=JSON.parse(read('launch-gates.json'));

// Parent onboarding and billing handoff.
has(onboarding,"/api/parent-student",'Parent onboarding must create students through the trusted API.');
has(onboarding,"openBilling=1",'Parent onboarding must hand off to the billing preview after student setup.');
has(parentStudent,'assertAppRequestOrigin(req)','Student creation must enforce application origin.');
has(parentStudent,"profile?.role==='parent'",'Student creation must require a parent account.');
has(billing,"profile?.role!==\"parent\"",'Billing UI must stay parent-only.');
has(billing,'/api/billing-overview','Billing state must come from the trusted billing API.');

// Parent-authorized student activation and household isolation.
has(parentDashboard,'/api/activate-student-login','Parent dashboard must activate a linked student through the server API.');
has(activation,'assertAppRequestOrigin(req)','Student activation must enforce application origin.');
has(activation,'parent_students?parent_profile_id=eq.','Student activation must verify the parent-student link.');
has(activation,'household_id=eq.','Student activation must constrain the student to the parent household.');

// Parent invitation acceptance must be same-origin, atomic, and service-only.
has(parentInvitations,'assertAppRequestOrigin(req)','Invitation acceptance must enforce application origin.');
has(parentInvitations,"/rest/v1/rpc/accept_parent_invitation_atomic",'Invitation acceptance must execute through the atomic trusted RPC.');
has(invitationMigration,'security invoker','Invitation acceptance RPC must not use SECURITY DEFINER.');
has(invitationMigration,'for update','Invitation acceptance RPC must serialize mutable acceptance state.');
has(invitationMigration,'revoke all on function public.accept_parent_invitation_atomic(uuid, uuid, text) from authenticated','Authenticated browser users must not execute the invitation acceptance RPC directly.');
has(invitationMigration,'grant execute on function public.accept_parent_invitation_atomic(uuid, uuid, text) to service_role','Only the service path should receive application execute authority for invitation acceptance.');

// Prior evidence ingestion remains part of the acceptance path.
has(prior,"storage.from('assessment-reports').upload",'Prior assessment flow must persist uploaded reports in private storage.');
has(prior,'parseAssessmentReport','Prior assessment flow must parse the uploaded report rather than require manual scores.');
has(prior,"from('prior_assessments').insert",'Prior assessment metadata must be stored for recovery/audit.');
has(prior,'updateSignals(student,data)','Processed prior reports must feed learner evidence signals.');

// Assessment-only diagnostic with durable resume.
has(diagnostic,'Resume your diagnostic','Diagnostic UI must expose durable resume.');
has(diagnostic,'answers and explanations are intentionally withheld','Diagnostic must remain assessment-only.');
has(diagnostic,'/api/diagnostic-session-v3','Diagnostic must use trusted session creation/resume.');
has(diagnostic,'/api/diagnostic-answer-v3','Diagnostic responses must be server scored/saved.');
has(diagnosticSession,'assertAppRequestOrigin(req)','Diagnostic session mutations must enforce application origin.');
has(diagnosticAnswer,'assertAppRequestOrigin(req)','Diagnostic answer mutations must enforce application origin.');

// Combined model and guided practice authority.
has(learningModel,"/api/learning-model-v3",'Combined learning-model refresh must use the trusted server endpoint.');
has(practice,"/api/practice-session-v3",'Guided practice must use trusted server sessions.');
has(practice,"/api/practice-answer-v3",'Guided-practice answers must be server scored.');
has(practice,'Correct answer:','Guided practice must reveal the correct answer after scoring.');
has(practice,'How to solve it:','Guided practice must provide instructional explanations.');
has(practiceSession,'assertAppRequestOrigin(req)','Practice session mutations must enforce application origin.');
has(practiceAnswer,'assertAppRequestOrigin(req)','Practice scoring mutations must enforce application origin.');

// Student progress, parent reporting, and admin operations remain wired.
has(journey,"from('skill_mastery')",'Student journey must read trusted mastery state.');
has(parentDashboard,'/api/parent-progress','Parent dashboard must use the trusted progress API.');
has(parentProgress,'household_id=eq.','Parent progress must constrain reads to the parent household.');
has(parentProgress,'scored_by_server=eq.true','Parent accuracy must use trusted server-scored practice responses.');
has(admin,'/api/admin-overview','Admin UI must load operations through the admin API.');
has(adminOverview,"profile?.role === 'admin'",'Admin overview must require an administrator role.');

// Prelaunch controls must remain closed during acceptance hardening.
for(const key of ['public_indexing','public_billing','live_payments','first_party_measurement','outbound_marketing']){
  assert.equal(gates[key],'disabled',`${key} must remain disabled until explicit launch approval.`);
}

console.log('Commercial acceptance-flow integration contract checks passed.');
