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
const sessionApi=read('api/practice-session-v3.js');
if(!/adaptive_level:state\.adaptiveBand/.test(sessionApi))fail('Practice-session API must surface the server-selected instructional adaptive level.');
const itemApi=read('api/practice-item-v3.js');
if(!/UUID\.test\(sessionId\)/.test(itemApi)||!/enforceCurrent\s*:\s*true/.test(itemApi))fail('Practice item delivery must validate the session UUID and enforce the current unanswered position.');
const answerApi=read('api/practice-answer-v3.js');
if(!/JSON\.stringify\(raw\)\.length>1000/.test(answerApi))fail('Practice answer API must reject oversized payloads.');
if(!/UUID\.test\(sessionId\)/.test(answerApi))fail('Practice answer API must validate session UUIDs.');
if(!/Number\.isInteger\(selected\)/.test(answerApi)||!/selected>3/.test(answerApi))fail('Practice answer API must validate answer choice bounds.');

const core=read('server/practice-core.js');
if(/practice-bank|question-bank/i.test(core))fail('Commercial practice runtime must not import committed authored question banks.');
if(!/practice-selection-core\.js/.test(core)||!/selectAdaptiveItems/.test(core)||!/adaptiveBand/.test(core))fail('Commercial practice runtime must use the pure mastery-adaptive selection core.');
if(!/masteryForSkill\(student\.id,skill\)/.test(core))fail('Commercial practice must read the current trusted skill mastery before planning a new session.');
if(!/selectAdaptiveItems\(source,\{length,mastery,randomIntFn:randomInt\}\)/.test(core))fail('Commercial practice must apply mastery-adaptive difficulty selection to the approved fresh item pool.');
if(!/mastery_before:mastery,adaptive_band:band/.test(core))fail('New commercial practice sessions must persist the mastery baseline and adaptive band used to plan the immutable item set.');
if(!/existing\.adaptive_band\|\|band/.test(core))fail('Resumed practice must report the adaptive band stored with the saved item plan rather than silently regenerating its planning provenance.');
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

const selection=read('practice-selection-core.js');
for(const band of ['foundation','balanced','challenge'])if(!selection.includes(`'${band}'`))fail(`Adaptive practice selector must retain the ${band} instructional band.`);
if(!/foundation:\[1,1,2,2,2\]/.test(selection)||!/balanced:\[1,2,2,2,3\]/.test(selection)||!/challenge:\[2,2,2,3,3\]/.test(selection))fail('Adaptive practice selector must retain the reviewed five-item difficulty mixes.');
if(!/value===null\|\|value===undefined\|\|value===''/i.test(selection))fail('Missing mastery must remain distinct from 0% mastery so new learners receive balanced rather than foundation-by-coercion practice.');

const learning=read('learning-v2.js'),guard=read('prelaunch-guard.js');
for(const route of ['/api/practice-session-v3','/api/practice-item-v3','/api/practice-answer-v3'])if(!learning.includes(route))fail(`Student learning UI must use ${route} for commercial practice.`);
if(!/window\.__SATPREP_PRELAUNCH__===true/.test(learning))fail('Browser-scored practice fallback must be explicitly limited to prelaunch mode.');
if(!/Commercial practice will not fall back to browser-scored questions/.test(learning))fail('Public/commercial practice must fail closed rather than silently falling back to browser-scored content.');
if(!/This practice session is saved after every answer and can be resumed/.test(learning))fail('Student practice UX must communicate durable resume behavior.');
if(!/serverFeedback=await authFetch\('\/api\/practice-answer-v3'/.test(learning))fail('Practice feedback UI must render only after trusted server scoring returns.');
if(!/window\.__SATPREP_PRELAUNCH__\s*=\s*!PUBLIC_BILLING_ENABLED/.test(guard))fail('Prelaunch guard must expose an explicit state used to gate QA-only browser scoring.');

const contentMigration=read('migrations/20260824_content_system.sql');
if(!/content_type text not null check \(content_type in \('diagnostic','practice'\)\)/i.test(contentMigration))fail('Content system must distinguish diagnostic and practice items.');
const migration=read('migrations/20260824_practice_sessions.sql');
for(const table of ['practice_sessions','practice_session_items','practice_responses']){
 if(!new RegExp(`create table if not exists public\\.${table}`,'i').test(migration))fail(`Practice migration must create ${table}.`);
 if(!migration.includes(`revoke all on table public.${table} from public, anon, authenticated;`))fail(`${table} must be inaccessible to browser roles.`);
}
if(!/mastery_before numeric/.test(migration)||!/adaptive_band text/.test(migration))fail('Practice-session schema must persist the trusted pre-session mastery and adaptive planning band.');
if(!/adaptive_band in \('foundation','balanced','challenge'\)/.test(migration))fail('Practice-session schema must constrain adaptive planning provenance to supported bands.');
if(!/create or replace function public\.finalize_practice_session\(p_session_id uuid\)/i.test(migration)||!/for update/i.test(migration))fail('Practice finalization must lock and finalize the session atomically.');
if(!/security definer/i.test(migration)||!/grant execute on function public\.finalize_practice_session\(uuid\) to service_role/i.test(migration))fail('Practice finalization RPC must be service-role controlled.');
if(!/on conflict\(student_id,skill_key\) do update/i.test(migration)||!/on conflict\(student_id,lesson_key\) do update/i.test(migration))fail('Practice finalization must update trusted mastery and lesson progress atomically.');

if(errors.length){for(const e of errors)console.error(`Practice security validation error: ${e}`);process.exit(1)}
console.log('Commercial practice security, adaptive selection, provenance, and resume invariants passed.');
