import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const router=read('diagnostic-router.js');
const session=read('api/diagnostic-session-v3.js');
const item=read('api/diagnostic-item-v3.js');
const core=read('server/diagnostic-core.js');

assert.match(session,/answered:state\.completed,total:state\.total/,'Diagnostic session state must return durable answered/total progress for resume.');
assert.match(core,/latestOpenAttempt\(student\.id\)/,'Secure diagnostic session creation must reuse an existing open attempt.');
assert.match(core,/responseCount\(existing\.id,\{serverScored:true\}\)/,'Secure diagnostic resume position must derive from server-scored responses.');
assert.match(item,/questionForAttempt\(ctx\.student\.id,attemptId,position,\{enforceCurrent:true\}\)/,'Question delivery must enforce the current durable server position for the authenticated student.');
assert.match(router,/Resume at question '\+\(answered\+1\)/,'Diagnostic gate must render the next server-derived question when resuming.');
assert.match(router,/recoverAnswerSubmit/,'Diagnostic answer failures must enter a server-state reconciliation path.');
assert.match(router,/Reconnecting and checking whether your answer was saved/,'Recovery UI must tell the learner that saved progress is being checked.');
assert.match(router,/const state=await sessionState\(\)/,'Transient answer recovery must reload durable session state.');
assert.match(router,/answered>position&&answered<serverTotal/,'If the server advanced despite a lost response, recovery must move to the next unanswered question.');
assert.match(router,/answered>=serverTotal&&serverTotal>0/,'Recovery must detect the saved-last-answer/finalization-interrupted case.');
assert.match(router,/attempt_id:attemptId,position,\.\.\.answer,response_ms:responseMs/,'Last-answer recovery must replay the exact same response shape through the idempotent trusted scoring endpoint.');
assert.match(router,/Retry the same answer when the connection returns/,'Unconfirmed recovery must instruct the learner to retry the same response rather than changing it.');
assert.match(router,/Your previously submitted answers remain saved/,'Question-load recovery must state that previously committed progress is durable.');
assert.match(router,/Assessment answers and explanations are not shown during the diagnostic/,'Recovery/resume UI must preserve assessment-feedback separation.');
assert.doesNotMatch(router,/serverFeedback|Correct answer:/,'Diagnostic recovery code must not introduce learning-mode answer feedback.');

console.log('Secure diagnostic resume and transient-network recovery checks passed.');
