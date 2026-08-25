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
if(!/hasChoice===hasText/.test(answerApi))fail('Practice answer API must require exactly one MCQ or SPR response shape.');
if(!/Number\.isInteger\(submitted\)/.test(answerApi)||!/submitted>3/.test(answerApi))fail('Practice answer API must validate MCQ answer choice bounds.');
if(!/String\(raw\.response_text\)/.test(answerApi))fail('Practice answer API must accept an SPR response for server-side validation.');

const core=read('server/practice-core.js');
if(/practice-bank|question-bank/i.test(core))fail('Commercial practice runtime must not import committed authored question banks.');
if(!/practice-selection-core\.js/.test(core)||!/selectAdaptiveItems/.test(core)||!/adaptiveBand/.test(core))fail('Commercial practice runtime must use the pure mastery-adaptive selection core.');
if(!/commercial-content-policy\.js/.test(core)||!core.includes("evaluateSkillCoverage(bank,'practice')")||!core.includes('COMMERCIAL_CONTENT_POLICY.practice.minApprovedPerSkill'))fail('Commercial practice must enforce the shared approved depth and difficulty-coverage policy before opening a new session.');
if(!/response-scoring\.js/.test(core)||!/scoreResponse\(/.test(core))fail('Commercial practice runtime must use shared server-side MCQ/SPR response scoring.');
if(!/masteryForSkill\(student\.id,skill\)/.test(core))fail('Commercial practice must read the current trusted skill mastery before planning a new session.');
if(!/selectAdaptiveItems\(bank,\{length,mastery,sprTarget,recentItemIds,randomIntFn:randomInt\}\)/.test(core))fail('Commercial practice must apply mastery-adaptive difficulty, Math SPR selection, and recent-item rotation to the approved bank.');
if(!/practice_responses\?student_id=eq\./.test(core)||!/order=created_at\.desc&limit=50/.test(core)||!/recentItemIds=\(recent\|\|\[\]\)\.map/.test(core))fail('Commercial practice must use recent trusted response history to reduce unnecessary repetition.');
if(!core.includes("sprTarget=meta.section==='MATH'?Math.max(1,Math.round(length*.25)):0"))fail('Math guided practice must target approximately 25% SPR when the approved pool supports it.');
if(!/mastery_before:mastery,adaptive_band:band/.test(core))fail('New commercial practice sessions must persist the mastery baseline and adaptive band used to plan the immutable item set.');
if(!/existing\.adaptive_band\|\|band/.test(core))fail('Resumed practice must report the adaptive band stored with the saved item plan rather than silently regenerating its planning provenance.');
if(!/content_type=eq\.practice&skill_key=eq\./.test(core)||!/qa_status=eq\.production_approved&active=eq\.true/.test(core))fail('Commercial practice selection must use active production-approved server practice content for the requested skill.');
if(!core.includes('function candidateIdFilter')||!core.includes('content_answer_keys?select=item_id,answer,explanation&item_id=in.${itemFilter}')||!core.includes('content_item_reviews?select=id,item_id,review_type,reviewer_label,decision,content_hash,created_at&item_id=in.${itemFilter}'))fail('Commercial practice review/key reads must be scoped to the requested skill/exam candidate IDs rather than scanning the full proprietary content store.');
if(!/row\?\.format==='spr'&&row\?\.section==='MATH'/.test(core))fail('Student-produced response content must be restricted to Math in commercial practice.');
for(const review of ['accuracy','alignment','editorial','bias_accessibility','originality'])if(!core.includes(`'${review}'`))fail(`Commercial practice approval gate must require ${review} review.`);
if(!/databaseReviewContent\('practice'/.test(core)||!/createHash\('sha256'\)/.test(core)||!/r\.content_hash===hash/.test(core))fail('Commercial practice runtime must enforce exact SHA-256 hash-pinned review approval.');
if(!/changed after review/.test(core))fail('Commercial practice must fail closed if content changes after review.');
const safe=core.match(/function safeQuestion\([^)]*\)\{([^}]+)\}/s)?.[1]||'';
if(!safe)fail('Could not verify safe commercial practice question projection.');
else if(/answerIndex|correctIndex|explanation|distractor/i.test(safe))fail('Practice item delivery must not expose the scoring key or explanation before submission.');
if(!/content_answer_keys\?item_id=eq\./.test(core)||!/answer:key\.answer/.test(core)||!/explanation:key\.explanation/.test(core))fail('Commercial practice scoring must retrieve scoring material from the server-only answer-key store.');
if(!/response_text:scored\.responseText/.test(core)||!/selected_answer:scored\.selectedAnswer/.test(core))fail('Commercial practice must persist mutually exclusive MCQ/SPR response fields after server validation.');
if(!/scored_by_server:true/.test(core)||!/scored_by_server=eq\.true/.test(core))fail('Commercial practice responses must be explicitly server-scored and progress must count only trusted rows.');
if(!/finalize_practice_session/.test(core))fail('Commercial practice completion must use the atomic server-side finalization RPC.');
if(!/latestOpen\(/.test(core)||!/practice_session_items/.test(core)||!/resumed:true/.test(core))fail('Commercial practice engine must support durable server-side resume from a persisted item plan.');
if(!/correct_answer_index/.test(core)||!/correct_answer:/.test(core)||!/explanation/.test(core))fail('Practice submission feedback must return correctness, the correct answer, and an explanation after scoring.');

const selection=read('practice-selection-core.js');
for(const band of ['foundation','balanced','challenge'])if(!selection.includes(`'${band}'`))fail(`Adaptive practice selector must retain the ${band} instructional band.`);
if(!/foundation:\[1,1,2,2,2\]/.test(selection)||!/balanced:\[1,2,2,2,3\]/.test(selection)||!/challenge:\[2,2,2,3,3\]/.test(selection))fail('Adaptive practice selector must retain the reviewed five-item difficulty mixes.');
if(!/value===null\|\|value===undefined\|\|value===''/i.test(selection))fail('Missing mastery must remain distinct from 0% mastery so new learners receive balanced rather than foundation-by-coercion practice.');
if(!/recentItemIds=\[\]/.test(selection)||!/recencyMap/.test(selection)||!/preferFresher/.test(selection))fail('Adaptive practice selection must prefer unseen and least-recently-used items within equivalent difficulty choices.');

const learning=read('learning-v2.js'),guard=read('prelaunch-guard.js');
for(const route of ['/api/practice-session-v3','/api/practice-item-v3','/api/practice-answer-v3'])if(!learning.includes(route))fail(`Student learning UI must use ${route} for commercial practice.`);
if(!/q\.format==='spr'/.test(learning)||!/id="serverPracticeSpr"/.test(learning)||!/response_text:serverResponseText\.trim\(\)/.test(learning))fail('Student commercial-practice UI must render and submit Math student-produced responses.');
if(!/window\.__SATPREP_PRELAUNCH__===true/.test(learning))fail('Browser-scored practice fallback must be explicitly limited to prelaunch mode.');
if(!/Commercial practice will not fall back to browser-scored questions/.test(learning))fail('Public/commercial practice must fail closed rather than silently falling back to browser-scored content.');
if(!/This practice session is saved after every answer and can be resumed/.test(learning))fail('Student practice UX must communicate durable resume behavior.');
if(!/serverFeedback=await authFetch\('\/api\/practice-answer-v3'/.test(learning))fail('Practice feedback UI must render only after trusted server scoring returns.');
if(!/window\.__SATPREP_PRELAUNCH__\s*=\s*!PUBLIC_BILLING_ENABLED/.test(guard))fail('Prelaunch guard must expose an explicit state used to gate QA-only browser scoring.');

const contentMigration=read('migrations/20260824_content_system.sql');
if(!/format text not null check \(format in \('mcq','spr'\)\)/i.test(contentMigration))fail('Content system must distinguish MCQ and student-produced response items.');
const migration=read('migrations/20260824_practice_sessions.sql');
for(const table of ['practice_sessions','practice_session_items','practice_responses']){
 if(!new RegExp(`create table if not exists public\\.${table}`,'i').test(migration))fail(`Practice migration must create ${table}.`);
 if(!migration.includes(`revoke all on table public.${table} from public, anon, authenticated;`))fail(`${table} must be inaccessible to browser roles.`);
}
const sprMigration=read('migrations/20260824_spr_responses.sql');
if(!/practice_responses[\s\S]*response_text text/i.test(sprMigration)||!/diagnostic_responses[\s\S]*response_text text/i.test(sprMigration))fail('SPR migration must add durable text responses to practice and diagnostic response storage.');
if(!/selected_answer drop not null/i.test(sprMigration)||!/one_answer_shape/i.test(sprMigration))fail('SPR response storage must allow one mutually exclusive MCQ or SPR answer shape.');
if(!/mastery_before numeric/.test(migration)||!/adaptive_band text/.test(migration))fail('Practice-session schema must persist the trusted pre-session mastery and adaptive planning band.');
if(!/adaptive_band in \('foundation','balanced','challenge'\)/.test(migration))fail('Practice-session schema must constrain adaptive planning provenance to supported bands.');
if(!/create or replace function public\.finalize_practice_session\(p_session_id uuid\)/i.test(migration)||!/for update/i.test(migration))fail('Practice finalization must lock and finalize the session atomically.');
if(!/security definer/i.test(migration)||!/grant execute on function public\.finalize_practice_session\(uuid\) to service_role/i.test(migration))fail('Practice finalization RPC must be service-role controlled.');
if(!/on conflict\(student_id,skill_key\) do update/i.test(migration)||!/on conflict\(student_id,lesson_key\) do update/i.test(migration))fail('Practice finalization must update trusted mastery and lesson progress atomically.');

if(errors.length){for(const e of errors)console.error(`Practice security validation error: ${e}`);process.exit(1)}
console.log('Commercial MCQ/SPR practice security, adaptive selection, scoped review reads, least-recently-used rotation, content-depth policy, provenance, and resume invariants passed.');
