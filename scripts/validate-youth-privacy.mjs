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

const migration=read('migrations/20260824_student_signup_age_gate.sql');
if(!/new\.raw_app_meta_data->>['"]satprep_parent_authorized['"]/.test(migration))fail('Database age gate must rely on admin-controlled app metadata for parent-authorized account provenance.');
if(!/new\.raw_user_meta_data->>['"]date_of_birth['"]/.test(migration))fail('Database age gate must require direct student date of birth.');
if(!/current_date - interval ['"]13 years['"]/.test(migration))fail('Database age gate must enforce the under-13 parent/guardian boundary.');
if(!/requested_role = ['"]student['"] and not parent_authorized/.test(migration))fail('Database age gate must apply to direct student creation while allowing trusted parent-authorized creation.');
if(!/security definer/.test(migration)||!/set search_path = ['"]['"]/.test(migration))fail('Auth trigger age gate must retain a locked-down security-definer search path.');

if(errors.length){for(const e of errors)console.error(`Youth privacy validation error: ${e}`);process.exit(1)}
console.log('Youth-account privacy boundary validation passed.');
