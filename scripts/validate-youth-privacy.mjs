import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),errors=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>errors.push(m);

const marketing=read('marketing.js');
if(!/age<13\?under13\(\):teenSignup\(age\)/.test(marketing))fail('Student signup UI must route under-13 users to the parent/guardian flow.');
if(!/\/api\/parent-setup-request/.test(marketing))fail('Under-13 setup must use the parent/guardian server workflow rather than creating a direct student account.');
if(!/date_of_birth\s*:\s*document\.querySelector\(["']#sDob["']\)\.value/.test(marketing))fail('Direct student signup must provide date of birth for the database age gate.');

const guard=read('prelaunch-guard.js');
if(!/age == null \|\| age < 13 \|\| age > 20/.test(guard))fail('Capture-phase youth signup guard must reject missing/under-13/out-of-range direct student signup.');

const activation=read('api/activate-student-login.js');
if(!/app_metadata\s*:\s*\{satprep_parent_authorized:true,account_origin:['"]parent_activation['"]\}/.test(activation))fail('Parent-created student logins must carry trusted app_metadata provenance.');
if(!/p\.role!==['"]parent['"]/.test(activation)||!/parent_students/.test(activation))fail('Parent student-login activation must verify the authenticated parent and linked student.');
if(!/parental_consents/.test(activation))fail('Parent-created student login must record the existing parental consent event for later legal/privacy reconciliation.');

const onboarding=read('onboarding.js');
if(!/authedPost\(['"]\/api\/parent-student['"]/.test(onboarding))fail('Parent-created learner records must go through the protected server API.');
if(!/authedPost\(['"]\/api\/student-parent-invitation['"]/.test(onboarding))fail('Student-created parent invitations must go through the protected server API.');
if(/\.from\(["']students["']\)\.insert|\.from\(["']parent_students["']\)\.(?:insert|upsert)|\.from\(["']parent_invitations["']\)\.insert/.test(onboarding))fail('Family setup browser code must not directly create student/link/invitation rows.');

const parentStudent=read('api/parent-student.js');
if(!/authenticatedUser\(req\)/.test(parentStudent)||!/profile\?\.role===['"]parent['"]/.test(parentStudent))fail('Parent student-creation API must authenticate and require the parent role.');
if(!/enforceRateLimit\(ctx\.user\.id,['"]parent\/student-create['"]/.test(parentStudent)||!/Retry-After/.test(parentStudent))fail('Parent student-creation API must use durable rate limiting with Retry-After.');
if(!/parent_students\?on_conflict=parent_profile_id,student_id/.test(parentStudent))fail('Parent student-creation API must establish the explicit parent-student link server-side.');
if(!/count>=3/.test(parentStudent))fail('Parent student-creation API must enforce the current household student ceiling.');

const studentInvite=read('api/student-parent-invitation.js');
if(!/profile\.role!==['"]student['"]/.test(studentInvite)||!/student\.household_id/.test(studentInvite))fail('Student parent-invitation API must require an unlinked student account.');
if(!/enforceRateLimit\(ctx\.user\.id,['"]student\/parent-invitation-create['"]/.test(studentInvite)||!/Retry-After/.test(studentInvite))fail('Student parent-invitation API must use durable rate limiting with Retry-After.');
if(!/parentEmail===String\(ctx\.profile\.email/.test(studentInvite))fail('Student invitation route must reject inviting the student login address as its own parent.');
if(!/status:['"]pending['"]/.test(studentInvite)||!/expires_at:expiresAt/.test(studentInvite))fail('Student invitation route must create bounded pending invitations with expiry.');

const migration=read('migrations/20260824_student_signup_age_gate.sql');
if(!/new\.raw_app_meta_data->>['"]satprep_parent_authorized['"]/.test(migration))fail('Database age gate must rely on admin-controlled app metadata for parent-authorized account provenance.');
if(!/new\.raw_user_meta_data->>['"]date_of_birth['"]/.test(migration))fail('Database age gate must require direct student date of birth.');
if(!/current_date - interval ['"]13 years['"]/.test(migration))fail('Database age gate must enforce the under-13 parent/guardian boundary.');
if(!/requested_role = ['"]student['"] and not parent_authorized/.test(migration))fail('Database age gate must apply to direct student creation while allowing trusted parent-authorized creation.');
if(!/security definer/.test(migration)||!/set search_path = ['"]['"]/.test(migration))fail('Auth trigger age gate must retain a locked-down security-definer search path.');

if(errors.length){for(const e of errors)console.error(`Youth privacy validation error: ${e}`);process.exit(1)}
console.log('Youth-account privacy boundary validation passed.');
