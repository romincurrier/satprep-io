import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const diagSession=read('api/diagnostic-session-v3.js');
const diagItem=read('api/diagnostic-item-v3.js');
const diagAnswer=read('api/diagnostic-answer-v3.js');
const diagCore=read('server/diagnostic-core.js');
const diagMigration=read('migrations/20260826_atomic_diagnostic_response_submission.sql');
const practiceSession=read('api/practice-session-v3.js');
const practiceItem=read('api/practice-item-v3.js');
const practiceAnswer=read('api/practice-answer-v3.js');
const practiceCore=read('server/practice-core.js');

for(const [label,source] of [
 ['diagnostic session',diagSession],['diagnostic item',diagItem],['diagnostic answer',diagAnswer],
 ['practice session',practiceSession],['practice item',practiceItem],['practice answer',practiceAnswer]
]){
 assert.match(source,/studentContext\(req\)/,`${label} endpoint must derive the learner from the authenticated account.`);
 assert.match(source,/ctx\.profile\?\.role!==['"]student['"]/,`${label} endpoint must reject non-student accounts.`);
}

assert.match(diagItem,/questionForAttempt\(ctx\.student\.id,attemptId,position/,`Diagnostic item reads must pass the authenticated student's server-resolved ID.`);
assert.match(diagAnswer,/scoreDiagnosticAnswer\(ctx\.student,attemptId,position/,`Diagnostic scoring must pass the authenticated server-resolved student.`);
assert.match(diagCore,/diagnostic_attempts\?id=eq\.\$\{encodeURIComponent\(attemptId\)\}&student_id=eq\.\$\{encodeURIComponent\(studentId\)\}/,`Diagnostic core must scope attempt lookup by both attempt and student.`);
assert.match(diagMigration,/where id = p_attempt_id and student_id = p_student_id\s+for update;/,`Atomic diagnostic submission must independently bind the attempt to the supplied trusted student ID under a row lock.`);
assert.match(diagMigration,/dr\.student_id = p_student_id/,`Atomic diagnostic response counting/idempotency must remain student-bound.`);

assert.match(practiceItem,/questionForPractice\(ctx\.student\.id,sessionId,position/,`Practice item reads must pass the authenticated student's server-resolved ID.`);
assert.match(practiceAnswer,/scorePracticeAnswer\(ctx\.student,sessionId,position/,`Practice scoring must pass the authenticated server-resolved student.`);
assert.match(practiceCore,/practice_sessions\?id=eq\.\$\{encodeURIComponent\(sessionId\)\}&student_id=eq\.\$\{encodeURIComponent\(studentId\)\}/,`Practice core must scope session lookup by both session and student.`);
assert.match(practiceCore,/student_id:student\.id,item_id:item\.id,position:p/,`New trusted practice responses must persist the authenticated student ID rather than a client-provided identity.`);

assert.doesNotMatch(diagAnswer,/student_id\s*[:=]\s*raw\./,`Diagnostic endpoint must never accept a client-provided student identity.`);
assert.doesNotMatch(practiceAnswer,/student_id\s*[:=]\s*raw\./,`Practice endpoint must never accept a client-provided student identity.`);

console.log('Authenticated-student diagnostic/practice ownership boundary checks passed.');
