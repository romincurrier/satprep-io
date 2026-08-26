import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const index=read('index.html');
const learning=read('learning-v2.js');
const recovery=read('practice-recovery-guard.js');
const core=read('server/practice-core.js');
const migration=read('migrations/20260826_atomic_practice_response_submission.sql');

const learningPos=index.indexOf('src="/learning-v2.js"');
const recoveryPos=index.indexOf('src="/practice-recovery-guard.js"');
assert.ok(learningPos>=0&&recoveryPos>learningPos,'Practice recovery guard must load after learning-v2.js.');
assert.match(learning,/This practice session is saved after every answer and can be resumed after a refresh or new browser window/,'Guided-practice UI must communicate durable resume.');
assert.match(learning,/serverFeedback=await authFetch\('\/api\/practice-answer-v3'/,'Guided-practice feedback must come from the trusted scoring endpoint.');
assert.match(recovery,/#serverPracticeSave \.error/,'Recovery guard must activate only after an ambiguous trusted-answer failure.');
assert.match(recovery,/button\.disabled=true/,'Recovery guard must lock existing MCQ choices after an ambiguous save.');
assert.match(recovery,/input\.disabled=true/,'Recovery guard must lock an SPR value after an ambiguous save.');
assert.match(recovery,/Retry same answer/,'Recovery action must explicitly replay the same answer.');
assert.match(recovery,/Retry the same saved practice answer/,'Retry control must expose an accessible same-answer label.');
assert.match(recovery,/event\.target\.closest\?\.\('\[data-server-practice-choice\]'/,'Capture guard must prevent changing an MCQ while retry state is ambiguous.');
assert.match(recovery,/event\.target\?\.id==='serverPracticeSpr'/,'Capture guard must prevent changing an SPR while retry state is ambiguous.');
assert.match(core,/submit_practice_response_secure_v3/,'Same-answer recovery must terminate at the atomic trusted practice submission boundary.');
assert.match(core,/idempotent:written\.idempotent===true/,'Trusted practice scoring must surface identical-retry idempotency.');
assert.match(migration,/already submitted and cannot be changed/,'Database boundary must reject changed practice retries.');
assert.match(migration,/return query select true, true, v_answered, v_total/,'Database boundary must accept identical retries idempotently.');

console.log('Guided-practice same-answer network recovery checks passed.');
