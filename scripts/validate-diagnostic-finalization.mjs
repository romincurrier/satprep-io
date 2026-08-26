import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const core=read('server/diagnostic-core.js');
const migration=read('migrations/20260826_atomic_diagnostic_finalization.sql');

assert.ok(core.includes('/rest/v1/rpc/finalize_diagnostic_attempt_secure_v3'),'Secure-v3 diagnostic completion must use the atomic trusted RPC.');
assert.ok(!core.includes('/rest/v1/skill_mastery?on_conflict=student_id,skill_key'),'Diagnostic completion must not revert to sequential mastery writes.');
assert.ok(migration.includes('security invoker'),'Diagnostic finalization must execute with invoker rights.');
assert.ok(migration.includes('for update'),'Diagnostic finalization must serialize mutable attempt/student state.');
assert.ok(migration.includes('v_answered < v_total'),'Diagnostic finalization must reject incomplete planned assessments.');
assert.ok(migration.includes('from public, anon, authenticated'),'Browser roles must not be granted direct finalization authority.');
assert.ok(migration.includes('to service_role'),'Only the trusted service path should receive finalization execute authority.');

console.log('Atomic secure-v3 diagnostic finalization checks passed.');
