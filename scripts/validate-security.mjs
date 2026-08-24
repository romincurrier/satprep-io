import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),errors=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>errors.push(m);

const index=read('index.html');
if(/diagnostic-feedback\.js/i.test(index))fail('Diagnostic feedback must not be loaded during assessment.');
if(fs.existsSync(path.join(root,'diagnostic-feedback.js')))fail('Obsolete client-side diagnostic feedback/answer-key artifact must not ship.');
if(/marketing-events\.js/i.test(index))fail('Marketing measurement is gated until its migration/privacy review are complete.');
if(fs.existsSync(path.join(root,'api/billing-status.js')))fail('Public billing/environment configuration diagnostic endpoint must not ship.');

const router=read('diagnostic-router.js');
if(/question-bank-production|question-bank\.js|answerIndex|correct_answer/i.test(router))fail('Secure diagnostic client must not import or reference diagnostic answer keys.');

const itemApi=read('api/diagnostic-item-v3.js');
if(!/enforceCurrent\s*:\s*true/.test(itemApi))fail('Secure diagnostic item delivery must enforce the current unanswered position.');
const answerApi=read('api/diagnostic-answer-v3.js');
if(!/JSON\.stringify\(raw\)\.length\s*>\s*1000/.test(answerApi))fail('Secure diagnostic answer API must reject oversized payloads.');
if(!/UUID\.test\(attemptId\)/.test(answerApi))fail('Secure diagnostic answer API must validate attempt UUIDs before server scoring.');
if(!/Number\.isInteger\(selected\)/.test(answerApi)||!/selected\s*>\s*3/.test(answerApi))fail('Secure diagnostic answer API must validate answer choice bounds.');

const protectedApis=[
 ['api/diagnostic-session-v3.js','diagnostic/session'],
 ['api/diagnostic-item-v3.js','diagnostic/item'],
 ['api/diagnostic-answer-v3.js','diagnostic/answer'],
 ['api/activate-student-login.js','account/student-activation'],
 ['api/parent-invitations.js','parent/invitations/read'],
 ['api/parent-invitations.js','parent/invitations/accept'],
 ['api/parent-setup-request.js','parent/setup-request'],
 ['api/create-checkout-session.js','billing/checkout-create'],
 ['api/confirm-checkout-session.js','billing/checkout-confirm'],
 ['api/create-portal-session.js','billing/portal-create']
];
for(const [file,route] of protectedApis){const txt=read(file);if(!/enforceRateLimit\(/.test(txt)||!txt.includes(`'${route}'`))fail(`${file}: protected endpoint must enforce durable rate limit ${route}.`);if(!/Retry-After/.test(txt))fail(`${file}: rate-limited responses must emit Retry-After.`)}

const serverAccess=read('server/supabase-server.js');
if(!/export async function enforceRateLimit/.test(serverAccess)||!/consume_api_rate_limit/.test(serverAccess))fail('Server data layer must expose the durable rate-limit helper.');
if(!/createHash\('sha256'\)/.test(serverAccess))fail('Rate-limit subjects must be hashed before persistence.');
if(!/status\s*:\s*429/.test(serverAccess)||!/retryAfter/.test(serverAccess))fail('Rate-limit helper must fail with 429 and a retry interval when the limit is exceeded.');
if(!/Request protection is not ready/.test(serverAccess)||!/status\s*:\s*503/.test(serverAccess))fail('Rate-limit backend failure must fail closed for privileged endpoints.');

const rateMigration=read('migrations/20260824_api_rate_limits.sql');
if(!/create table if not exists public\.api_rate_limits/i.test(rateMigration)||!/create or replace function public\.consume_api_rate_limit/i.test(rateMigration))fail('Rate-limit migration must define the durable counter table and atomic consumption function.');
if(!/revoke all on table public\.api_rate_limits from public, anon, authenticated/i.test(rateMigration))fail('Rate-limit counters must not be readable or writable by browser roles.');
if(!/revoke all on function public\.consume_api_rate_limit\(text,text,integer,integer\) from public, anon, authenticated/i.test(rateMigration)||!/grant execute on function public\.consume_api_rate_limit\(text,text,integer,integer\) to service_role/i.test(rateMigration))fail('Rate-limit RPC must be executable only by the service role.');

const core=read('server/diagnostic-core.js');
if(/question-bank-production|question-bank\.js|answerIndex\s*\}/i.test(core))fail('Secure diagnostic runtime must not source scoring content from the committed JavaScript question bank.');
if(/correct_answer\s*:\s*item\.answerIndex/.test(core))fail('Secure diagnostic must not persist the real answer key in browser-readable legacy response fields.');
const safeQuestion=core.match(/export function safeQuestion\([^)]*\)\{([^}]+)\}/s)?.[1]||'';
if(!safeQuestion)fail('Could not verify safeQuestion projection.');
else if(/answerIndex|explanation|distractor/i.test(safeQuestion))fail('safeQuestion must not expose answer/explanation fields.');
if(!/contentSystemReady\(\)/.test(core)||!/content_items\?select=id,qa_status,active&limit=1/.test(core))fail('Secure diagnostic must verify that the server-only content system is ready before creating/scoring secure attempts.');
if(!/content_item_reviews\?select=item_id,review_type,decision,content_hash&limit=1/.test(core))fail('Secure diagnostic readiness must require the hash-pinned review schema.');
if(!/qa_status=eq\.production_approved&active=eq\.true&format=eq\.mcq/.test(core))fail('Secure diagnostic selection must be limited to active production-approved MCQ content.');
for(const review of ['accuracy','alignment','editorial','bias_accessibility','originality'])if(!core.includes(`'${review}'`))fail(`Secure diagnostic approval gate must require ${review} review.`);
if(!/content_answer_keys\?select=item_id,answer,explanation/.test(core)||!/content_item_reviews\?select=id,item_id,review_type,reviewer_label,decision,content_hash,created_at&order=created_at\.asc,id\.asc/.test(core))fail('Secure diagnostic plan creation must require scoring content and an ordered hash-pinned independent-review audit trail.');
if(!/byType\.set\(r\.review_type,r\)/.test(core)||!/r\?\.decision==='approve'/.test(core))fail('Secure diagnostic approval gate must use the latest decision for each required review type.');
if(!/createHash\('sha256'\)/.test(core)||!/function runtimeContentHash/.test(core))fail('Secure diagnostic runtime must recompute the exact reviewed content hash before delivery/scoring.');
if(!/r\?\.content_hash===contentHash/.test(core))fail('Secure diagnostic approvals must match the recomputed current content hash.');
if(!/function approvedContent/.test(core)||!/changed after review/.test(core))fail('Secure diagnostic item delivery/scoring must fail closed when content changes after review.');
if(!/diagnostic_attempt_items/.test(core)||!/assertPersistedPlanItem/.test(core))fail('Secure diagnostic must persist and verify the server-selected item plan.');
if(!/content_answer_keys\?item_id=eq\./.test(core)||!/correctIndex/.test(core))fail('Secure diagnostic scoring must retrieve the answer key through the server-only answer-key table.');
if(!/content_item_id:item\.id/.test(core))fail('Secure diagnostic responses must be linked to the server-selected content item.');
if(!/scored_by_server:true/.test(core))fail('Secure diagnostic response writes must be explicitly marked as server-scored.');
if(!/scored_by_server=eq\.true/.test(core))fail('Secure diagnostic progress/finalization must filter to server-scored rows.');
if(!/r\.content_item_id===r\.question_key/.test(core))fail('Secure diagnostic finalization must verify response/content-item identity.');

const contentMigration=read('migrations/20260824_content_system.sql');
if(!/add column if not exists content_item_id/i.test(contentMigration)||!/add column if not exists scored_by_server/i.test(contentMigration))fail('Content migration must add secure response provenance columns.');
if(!/content_hash text not null check \(content_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/i.test(contentMigration))fail('Content review records must be pinned to a 64-character SHA-256 content hash.');
if(!/review_type in \('accuracy','alignment','editorial','bias_accessibility','originality','psychometric'\)/i.test(contentMigration))fail('Content review schema must support the required originality review dimension.');
if(!/secure_v3_responses_server_only/i.test(contentMigration)||!/as\s+restrictive/i.test(contentMigration))fail('Content migration must contain the restrictive secure-v3 diagnostic response policy.');
if(!/coalesce\s*\(\s*da\.summary\s*->>\s*'engine'\s*,\s*'legacy'\s*\)\s*=\s*'secure-v3'/i.test(contentMigration))fail('Secure-v3 response policy must identify secure-v3 attempts from the server-authored attempt summary.');
for(const table of ['content_items','content_answer_keys','content_item_reviews','diagnostic_attempt_items'])if(!contentMigration.includes(`revoke all on table public.${table} from public, anon, authenticated;`))fail(`${table} must be explicitly revoked from browser roles.`);
if(/create policy\s+"diagnostic_plan_(student|parent)_read"/i.test(contentMigration))fail('The complete secure diagnostic plan must not have a browser SELECT policy.');

const serverAllowedPrefixes=['api/','server/','scripts/'];
function walk(dir='.'){
 for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  const rel=path.join(dir,entry.name).replace(/^\.\//,'').replaceAll('\\','/');
  if(['node_modules','.git','dist'].some(x=>rel===x||rel.startsWith(`${x}/`)))continue;
  if(entry.isDirectory()){walk(rel);continue}
  if(!/\.(js|mjs|html)$/.test(entry.name))continue;
  const txt=fs.readFileSync(path.join(root,rel),'utf8');
  if(txt.includes('SUPABASE_SERVICE_ROLE_KEY')&&!serverAllowedPrefixes.some(p=>rel.startsWith(p)))fail(`${rel}: service-role environment variable referenced outside server/build tooling.`);
  if(rel.startsWith('api/')&&/process\.env\.[A-Z0-9_]+/.test(txt)&&/configured\s*[:=]|secret_mode|environment\s*[:=]/i.test(txt)&&!/authenticatedUser\(|studentContext\(/.test(txt))fail(`${rel}: unauthenticated environment/configuration diagnostics may disclose deployment state.`);
 }
}
walk();

const vercel=JSON.parse(read('vercel.json'));
const headerRows=vercel.headers?.flatMap(x=>x.headers||[])||[];
const headerKeys=new Set(headerRows.map(x=>String(x.key).toLowerCase()));
for(const key of ['strict-transport-security','x-content-type-options','x-frame-options','referrer-policy','permissions-policy','x-robots-tag'])if(!headerKeys.has(key))fail(`vercel.json missing baseline security/prelaunch header: ${key}`);

if(errors.length){for(const e of errors)console.error(`Security validation error: ${e}`);process.exit(1)}
console.log('Security invariant validation passed.');
