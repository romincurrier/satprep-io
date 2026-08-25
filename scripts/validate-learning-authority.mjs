import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const client=read('learning-model.js');
const endpoint=read('api/learning-model-v3.js');
const core=read('server/learning-model-core.js');
const lock=read('migrations/20260825_trusted_learning_authority.sql');

assert.match(client,/fetch\('\/api\/learning-model-v3'/,'Browser learning-model refresh must use the trusted server endpoint.');
assert.doesNotMatch(client,/\.from\(['"]students['"]\)\.update/,'Browser learning-model code must not update student planning state directly.');
assert.doesNotMatch(client,/\.from\(['"]skill_mastery['"]\).*?(insert|update|upsert|delete)/s,'Browser learning-model code must not mutate mastery authority.');
assert.match(endpoint,/assertAppRequestOrigin\(req\)/,'Learning-model mutation must enforce same-application origin.');
assert.match(endpoint,/studentContext\(req\)/,'Learning-model mutation must resolve the authenticated student server-side.');
assert.match(endpoint,/enforceRateLimit\(ctx\.user\.id,'learning-model rebuild must be rate limited.');
assert.match(endpoint,/rebuildLearningModel\(ctx\.student\)/,'Endpoint must delegate composition to the trusted server core.');
assert.match(core,/student_skill_evidence/,'Server composition must include prior-assessment evidence.');
assert.match(core,/diagnostic_attempts/,'Server composition must include trusted diagnostic evidence.');
assert.match(core,/skill_mastery/,'Server composition must include trusted guided-practice mastery.');
assert.match(core,/version:'evidence-1\.2-server'/,'Server-composed learning models must carry a trusted model version.');
assert.match(core,/method:'PATCH'/,'Only trusted server code should persist the combined learning path.');
assert.match(lock,/revoke insert, update, delete on table public\.skill_mastery from anon, authenticated/i,'Trusted-authority migration must keep browser roles from mutating mastery.');
assert.match(lock,/revoke insert, update, delete on table public\.lesson_progress from anon, authenticated/i,'Trusted-authority migration must keep browser roles from mutating lesson progress.');
assert.match(lock,/revoke insert, update, delete on table public\.question_attempts from anon, authenticated/i,'Legacy browser-scored attempts must remain read-only.');

console.log('Trusted combined-learning authority checks passed.');
