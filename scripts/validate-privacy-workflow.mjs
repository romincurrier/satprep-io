import fs from 'node:fs';
const errors=[],read=p=>fs.readFileSync(p,'utf8'),fail=m=>errors.push(m);

const api=read('api/privacy-request.js');
if(!/authenticatedUser\(req\)/.test(api))fail('Privacy request API must require an authenticated user.');
for(const route of ['privacy/request-read','privacy/request-create'])if(!api.includes(`'${route}'`)||!/enforceRateLimit\(/.test(api))fail(`Privacy request API must durably rate limit ${route}.`);
if(!/requester_profile_id=eq\.\$\{encodeURIComponent\(auth\.profile\.id\)\}/.test(api))fail('Privacy request reads must be scoped to the authenticated requester profile.');
if(!/parent_students\?parent_profile_id=eq\./.test(api)||!/students\?id=eq\./.test(api))fail('Privacy request targeting must verify self-student or parent-linked-student ownership.');
if(!/TYPES=new Set\(\['access','correction','deletion','account_closure','other_privacy'\]\)/.test(api))fail('Privacy request types must be allowlisted.');
if(!/JSON\.stringify\(raw\)\.length>1000/.test(api))fail('Privacy request payload size must be bounded.');
if(!/status:'submitted'/.test(api))fail('New privacy requests must enter the submitted state; clients may not choose workflow state.');
if(/handled_by_profile_id\s*:|verified_at\s*:|completed_at\s*:/i.test(api.match(/JSON\.stringify\(\{requester_profile_id[\s\S]*?\}\)/)?.[0]||''))fail('Privacy request clients must not set verification, handling, or completion fields.');
if(!/existing:true/.test(api))fail('Privacy request API should de-duplicate an already-open equivalent request.');
if(!/Retry-After/.test(api))fail('Privacy request API must return Retry-After for rate-limit failures.');

const migration=read('migrations/20260824_privacy_requests.sql');
if(!/create table if not exists public\.privacy_requests/i.test(migration))fail('Privacy request migration must create the request queue.');
if(!/privacy_request_self_insert/.test(migration)||!/requester_profile_id=auth\.uid\(\)/.test(migration))fail('Privacy request RLS must constrain browser inserts to the requester.');
if(!/parent_students/.test(migration)||!/students/.test(migration))fail('Privacy request RLS must constrain learner targeting to self or linked children.');
if(!/handled_by_profile_id is null/.test(migration)||!/verified_at is null/.test(migration)||!/completed_at is null/.test(migration))fail('Browser privacy request insert policy must prevent clients from self-verifying or completing requests.');
if(/for update to authenticated/i.test(migration))fail('Authenticated browser roles must not receive a general privacy-request update policy.');

const upload=read('prior-assessments-v3.js');
if(!/storage\.from\('assessment-reports'\)\.upload\(path,file/.test(upload))fail('Prior-assessment uploads must use the dedicated assessment-reports bucket.');
if(!/path=`\$\{session\.user\.id\}\/\$\{student\.id\}\/\$\{crypto\.randomUUID\(\)\}\.pdf`/.test(upload))fail('Prior-assessment object paths must be scoped by uploader and student identifiers.');
if(!/file\.size>10\*1024\*1024/.test(upload)||!/accept=\"application\/pdf\"/.test(upload))fail('Prior-assessment uploads must remain PDF-only and limited to 10 MB in the browser flow.');
if(/getPublicUrl\s*\(/.test(upload))fail('Private prior-assessment uploads must never use a public Storage URL.');

const deleteApi=read('api/prior-assessment-report.js'),server=read('server/supabase-server.js'),storageMigration=read('migrations/20260826_prior_assessment_storage_privacy.sql');
if(!/req\.method!=='DELETE'/.test(deleteApi)||!/assertAppRequestOrigin\(req\)/.test(deleteApi)||!/authenticatedUser\(req\)/.test(deleteApi))fail('Prior-assessment deletion must be an authenticated same-origin DELETE operation.');
if(!deleteApi.includes("'privacy/prior-assessment-delete'")||!/enforceRateLimit\(/.test(deleteApi))fail('Prior-assessment deletion must be durably rate limited.');
if(!/parent_students\?parent_profile_id=eq\./.test(deleteApi)||!/students\?id=eq\./.test(deleteApi)||!/profile\.role==='admin'/.test(deleteApi))fail('Prior-assessment deletion must authorize the student, a linked parent, or an administrator.');
if(!/match\[1\].*row\.created_by/.test(deleteApi)||!/match\[2\].*row\.student_id/.test(deleteApi))fail('Prior-assessment deletion must verify that the immutable object path belongs to the recorded uploader and student.');
if(!/removeStorageObjects\('assessment-reports',\[filePath\]\)/.test(deleteApi))fail('Prior-assessment deletion must remove the private object through the Storage API before database cleanup.');
if(!/rpc\/delete_prior_assessment_record/.test(deleteApi))fail('Prior-assessment deletion must use the service-only transactional metadata cleanup RPC.');
if(/delete\s+from\s+storage\.objects/i.test(deleteApi)||/storage\.objects.*delete/i.test(deleteApi))fail('Prior-assessment files must never be deleted by direct SQL against storage.objects.');
if(!/\/storage\/v1\/object\//.test(server)||!/method:'DELETE'/.test(server)||!/prefixes/.test(server))fail('Server storage deletion helper must use the Supabase Storage API.');
if(!/prior_assessment_file_path_identity/.test(storageMigration)||!/prior_assessment_upload_identity_lock/.test(storageMigration))fail('Prior-assessment upload identity must be protected by a database constraint and immutable-field trigger.');
if(!/security invoker/i.test(storageMigration)||!/set search_path = ''/i.test(storageMigration))fail('Prior-assessment privacy helper functions must use invoker rights with a pinned empty search path.');
if(!/revoke all on function public\.delete_prior_assessment_record\(uuid\) from authenticated/i.test(storageMigration)||!/grant execute on function public\.delete_prior_assessment_record\(uuid\) to service_role/i.test(storageMigration))fail('Prior-assessment cleanup RPC must be executable only by the trusted service role.');

if(errors.length){for(const e of errors)console.error(`Privacy workflow validation error: ${e}`);process.exit(1)}
console.log('Privacy request and private assessment-report workflow validation passed.');
