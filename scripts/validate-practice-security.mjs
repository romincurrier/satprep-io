import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),errors=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>errors.push(m);

const apis=[
 ['api/practice-session-v3.js','practice/session'],
 ['api/practice-item-v3.js','practice/item'],
 ['api/practice-answer-v3.js','practice/answer']
];
for(const [file,route] of apis){const txt=read(file);if(!/studentContext\(/.test(txt))fail(`${file}: practice API must require authenticated student context.`);if(!/enforceRateLimit\(/.test(txt)||!txt.includes(`'${route}'`))fail(`${file}: practice API must enforce durable rate limit ${route}.`);if(!/Retry-After/.test(txt))fail(`${file}: rate-limited responses must emit Retry-After.`)}
const itemApi=read('api/practice-item-v3.js');
if(!/UUID\.test\(sessionId\)/.test(itemApi)||!/enforceCurrent\s*:\s*true/.test(itemApi))fail('Practice item delivery must validate the session UUID and enforce the current unanswered position.');
const answerApi=read('api/practice-answer-v3.js');
if(!/JSON\.stringify\(raw\)\.length>1000/.test(answerApi))fail('Practice answer API must reject oversized payloads.');
if(!/UUID\.test\(sessionId\)/.test(answerApi))fail('Practice answer API must validate session UUIDs.');
if(!/Number\.isInteger\(selected\)/.test(answerApi)||!/selected>3/.test(answerApi))fail('Practice answer API must validate answer choice bounds.');

const core=read('server/practice-core.js');
if(/practice-bank|question-bank/i.test(core))fail('Commercial practice runtime must not import committed authored question banks.');
if(!/content_type=eq\.practice&skill_key=eq\./.test(core)||!/qa_status=eq\.production_approved&active=eq\.true&format=eq\.mcq/.test(core))fail('Commercial practice selection must use active production-approved server practice MCQs for the requested skill.');
for(const review of ['accuracy','alignment','editorial','bias_accessibility','originality'])if(!core.includes(`'${review}'`))fail(`Commercial practice approval gate must require ${review} review.`);
if(!/type:'practice'/.test(core)||!/createHash\('sha256'\)/.test(core)||!/r\.content_hash===hash/.test(core))fail('Commercial practice runtime must enforce exact SHA-256 hash-pinned review approval.');
if(!/changed after review/.test(core))fail('Commercial practice must fail closed if content changes after review.');
const safe=core.match(/function safeQuestion\([^)]*\)\{([^}]+)\}/s)?.[1]||'';
if(!safe)fail('Could not verify safe commercial practice question projection.');
else if(/answerIndex|correctIndex|explanation|distractor/i.test(safe))fail('Practice item delivery must not expose the scoring key or explanation before submission.');
if(!/content_answer_keys\?item_id=eq\./.test(core)||!/correctIndex/.test(core)||!/explanation:key\.explanation/.test(core))fail('Commercial practice scoring must retrieve scoring material from the server-only answer-key store.');
if(!/scored_by_server:true/.test(core)||!/scored_by_server=eq\.true/.test(core))fail('Commercial practice responses must be explicitly server-scored and progress must count only trusted rows.');
if(!/finalize_practice_session/.test(core))fail('Commercial practice completion must use the atomic server-side finalization RPC.');
if(!/latestOpen\(/.test(core)||!/practice_session_items/.test(core)||!/resumed:true/.test(core))fail('Commercial practice engine must support durable server-side resume from a persisted item plan.');
if(!/correct_answer_index/.test(core)||!/correct_answer:/.test(core)||!/explanation/.test(core))fail('Practice submission feedback must return correctness, the correct answer, and an explanation after scoring.');

const contentMigration=read('migrations/20260824_content_system.sql');
if(!/content_type text not null check \(content_type in \('diagnostic','practice'\)\)/i.test(contentMigration))fail('Content system must distinguish diagnostic and practice items.');
const migration=read('migrations/20260824_practice_sessions.sql');
for(const table of ['practice_sessions','practice_session_items','practice_responses']){
 if(!new RegExp(`create table if not exists public\\.${table}`,'i').test(migration))fail(`Practice migration must create ${table}.`);
 if(!migration.includes(`revoke all on table public.${table} from public, anon, authenticated;`))fail(`${table} must be inaccessible to browser roles.`);
}
if(!/create or replace function public\.finalize_practice_session\(p_session_id uuid\)/i.test(migration)||!/for update/i.test(migration))fail('Practice finalization must lock and finalize the session atomically.');
if(!/security definer/i.test(migration)||!/grant execute on function public\.finalize_practice_session\(uuid\) to service_role/i.test(migration))fail('Practice finalization RPC must be service-role controlled.');
if(!/on conflict\(student_id,skill_key\) do update/i.test(migration)||!/on conflict\(student_id,lesson_key\) do update/i.test(migration))fail('Practice finalization must update trusted mastery and lesson progress atomically.');

if(errors.length){for(const e of errors)console.error(`Practice security validation error: ${e}`);process.exit(1)}
console.log('Commercial practice security invariants passed.');
