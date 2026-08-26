import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const core=read('server/diagnostic-core.js');
const migration=read('migrations/20260826_atomic_diagnostic_response_submission.sql');

assert.ok(core.includes('/rest/v1/rpc/submit_diagnostic_response_secure_v3'),'Secure-v3 diagnostic answers must use the atomic trusted RPC.');
assert.ok(!core.includes("service('/rest/v1/diagnostic_responses',{method:'POST'"),'Diagnostic answers must not revert to direct multi-request response inserts.');
assert.ok(migration.includes('security invoker'),'Diagnostic response submission must execute with invoker rights.');
assert.ok(migration.includes('for update'),'Diagnostic response submission must serialize mutable attempt state.');
assert.ok(migration.includes("a.summary->'question_plan'->>p_position"),'Diagnostic response submission must verify the persisted question plan.');
assert.ok(migration.includes('p_position <> v_answered'),'Diagnostic response submission must enforce server-trusted sequence.');
assert.ok(migration.includes('is distinct from p_selected_answer')&&migration.includes('is distinct from p_response_text'),'Repeated diagnostic submissions must reject changed answers.');
assert.ok(migration.includes('return query select true, true'),'Identical diagnostic retries must be explicitly idempotent.');
assert.ok(migration.includes('from public, anon, authenticated'),'Browser roles must not receive direct diagnostic response authority.');
assert.ok(migration.includes('to service_role'),'Only the trusted service path should receive diagnostic response execute authority.');

console.log('Atomic secure-v3 diagnostic answer-submission checks passed.');
