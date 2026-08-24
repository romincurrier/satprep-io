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

if(errors.length){for(const e of errors)console.error(`Privacy workflow validation error: ${e}`);process.exit(1)}
console.log('Privacy request workflow validation passed.');
