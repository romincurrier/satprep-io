import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),errors=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>errors.push(m);

const index=read('index.html');
if(/diagnostic-feedback\.js/i.test(index))fail('Diagnostic feedback must not be loaded during assessment.');
if(fs.existsSync(path.join(root,'diagnostic-feedback.js')))fail('Obsolete client-side diagnostic feedback/answer-key artifact must not ship.');
if(fs.existsSync(path.join(root,'api/billing-status.js')))fail('Public billing/environment configuration diagnostic endpoint must not ship.');

const prelaunchGuard=read('prelaunch-guard.js');
const marketingMeasurement=read('marketing-events.js');
const marketingEventApi=read('api/marketing-event.js');
if(!/const PUBLIC_MARKETING_MEASUREMENT_ENABLED = false/.test(prelaunchGuard))fail('First-party marketing measurement client gate must remain disabled during prelaunch.');
if(!/window\.__SATPREP_MARKETING_MEASUREMENT_ENABLED__ = PUBLIC_MARKETING_MEASUREMENT_ENABLED/.test(prelaunchGuard))fail('Prelaunch guard must establish the client measurement state before tracking initializes.');
if(!/isPublicMarketingSurface\(\)/.test(marketingMeasurement)||!/p\.get\('app'\)!=='1'/.test(marketingMeasurement))fail('Marketing measurement must remain restricted to public acquisition surfaces rather than authenticated application mode.');
if(!/window\.__SATPREP_MARKETING_MEASUREMENT_ENABLED__!==true\|\|!isPublicMarketingSurface\(\)/.test(marketingMeasurement))fail('Marketing client must fail closed when measurement is disabled or the current surface is not public marketing.');
if(!/process\.env\.MARKETING_MEASUREMENT_ENABLED/.test(marketingEventApi)||!/if\(!MEASUREMENT_ENABLED\)return json\(res,404/.test(marketingEventApi))fail('Marketing event API must require an independently enabled server measurement flag.');
if(!/if\(!origin\)return false/.test(marketingEventApi))fail('Marketing event API must reject originless submissions.');
if(!/EMAIL_LIKE/.test(marketingEventApi)||!/PHONE_LIKE/.test(marketingEventApi)||!/noContactData/.test(marketingEventApi))fail('Marketing event API must discard contact-like attribution values.');

const router=read('diagnostic-router.js');
if(/question-bank-production|question-bank\.js|answerIndex|correct_answer/i.test(router))fail('Secure diagnostic client must not import or reference diagnostic answer keys.');
if(!/secureDiagnosticSpr/.test(router)||!/response_text:input\.value\.trim\(\)/.test(router))fail('Secure diagnostic UI must support student-produced Math responses without exposing scoring material.');
if(!/answers and explanations are not shown during the diagnostic/i.test(router))fail('Secure diagnostic UI must preserve assessment-only behavior for both MCQ and SPR.');
const planCore=read('diagnostic-plan-core.js');
const blueprint=read('diagnostic-blueprint.js');
if(/question-bank-production|question-bank\.js|answerIndex|explanation/i.test(planCore))fail('Secure diagnostic planning core must not import or embed authored question content or answer keys.');
if(/question-bank-production|question-bank\.js/.test(blueprint))fail('Diagnostic blueprint compatibility module must remain free of authored question-bank dependencies.');
if(!/bank=\[\]/.test(planCore)||!/Array\.isArray\(bank\)\?bank:\[\]/.test(planCore))fail('Secure diagnostic planner must require an explicitly injected content bank.');
if(!/q\?\.section==='RW'\?format==='mcq'/.test(planCore)||!/\['mcq','spr'\]\.includes\(format\)/.test(planCore))fail('Secure diagnostic planner must keep Reading & Writing MCQ-only while permitting Math SPR.');
if(!/Math\.round\(desiredMath\*\.25\)/.test(planCore))fail('Secure diagnostic planner must target a public-spec-style Math SPR mix when the approved bank permits it.');

const itemApi=read('api/diagnostic-item-v3.js');
if(!/enforceCurrent\s*:\s*true/.test(itemApi))fail('Secure diagnostic item delivery must enforce the current unanswered position.');
const answerApi=read('api/diagnostic-answer-v3.js');
if(!/JSON\.stringify\(raw\)\.length\s*>\s*1000/.test(answerApi))fail('Secure diagnostic answer API must reject oversized payloads.');
if(!/UUID\.test\(attemptId\)/.test(answerApi))fail('Secure diagnostic answer API must validate attempt UUIDs before server scoring.');
if(!/hasChoice===hasText/.test(answerApi))fail('Secure diagnostic answer API must require exactly one MCQ or SPR response shape.');
if(!/Number\.isInteger\(submitted\)/.test(answerApi)||!/submitted>3/.test(answerApi))fail('Secure diagnostic answer API must validate MCQ answer choice bounds.');
if(!/String\(raw\.response_text\)/.test(answerApi))fail('Secure diagnostic answer API must accept an SPR response for server-side validation.');

const protectedApis=[
 ['api/diagnostic-session-v3.js','diagnostic/session'],
 ['api/diagnostic-item-v3.js','diagnostic/item'],
 ['api/diagnostic-answer-v3.js','diagnostic/answer'],
 ['api/practice-session-v3.js','practice/session'],
 ['api/practice-item-v3.js','practice/item'],
 ['api/practice-answer-v3.js','practice/answer'],
 ['api/activate-student-login.js','account/student-activation'],
 ['api/parent-invitations.js','parent/invitations/read'],
 ['api/parent-invitations.js','parent/invitations/accept'],
 ['api/parent-setup-request.js','parent/setup-request'],
 ['api/create-checkout-session.js','billing/checkout-create'],
 ['api/confirm-checkout-session.js','billing/checkout-confirm'],
 ['api/create-portal-session.js','billing/portal-create'],
 ['api/marketing-event.js','marketing/event']
];
for(const [file,route] of protectedApis){const txt=read(file);if(!/enforceRateLimit\(/.test(txt)||!txt.includes(`'${route}'`))fail(`${file}: protected endpoint must enforce durable rate limit ${route}.`);if(!/Retry-After/.test(txt))fail(`${file}: rate-limited responses must emit Retry-After.`)}

const stripeServer=read('server/stripe-server.js');
if(!/PUBLIC_HOSTS=new Set\(\['satprep\.io','www\.satprep\.io'\]\)/.test(stripeServer))fail('Stripe server must identify the canonical public hosts for launch gating.');
if(!/export function assertCheckoutSurfaceEnabled/.test(stripeServer)||!/PUBLIC_BILLING_ENABLED/.test(stripeServer))fail('Stripe server must expose a server-enforced public checkout launch gate.');
if(!/export function assertBillingPortalEnabled/.test(stripeServer)||!/PUBLIC_BILLING_PORTAL_ENABLED/.test(stripeServer))fail('Stripe server must expose an independently controlled billing-portal launch gate.');
if(!/ALLOW_PUBLIC_TEST_BILLING/.test(stripeServer)||!/mode!==['"]live['"]/.test(stripeServer))fail('Public billing must fail closed when the public host is still using a Stripe test key.');
for(const file of ['api/create-checkout-session.js','api/confirm-checkout-session.js'])if(!/assertCheckoutSurfaceEnabled\(req\)/.test(read(file)))fail(`${file}: public checkout flow must enforce the server launch gate.`);
if(!/assertBillingPortalEnabled\(req\)/.test(read('api/create-portal-session.js')))fail('api/create-portal-session.js: public billing management must enforce the independent server launch gate.');
const envExample=read('env.example');
for(const row of ['PUBLIC_BILLING_ENABLED=false','PUBLIC_BILLING_PORTAL_ENABLED=false','ALLOW_LIVE_BILLING=false','ALLOW_PUBLIC_TEST_BILLING=false','MARKETING_MEASUREMENT_ENABLED=false'])if(!envExample.includes(row))fail(`env.example must default ${row} for safe pre-launch configuration.`);

const serverAccess=read('server/supabase-server.js');
if(!/export async function enforceRateLimit/.test(serverAccess)||!/consume_api_rate_limit/.test(serverAccess))fail('Server data layer must expose the durable rate-limit helper.');
if(!/createHash\('sha256'\)/.test(serverAccess))fail('Rate-limit subjects must be hashed before persistence.');
if(!/status\s*:\s*429/.test(serverAccess)||!/retryAfter/.test(serverAccess))fail('Rate-limit helper must fail with 429 and a retry interval when the limit is exceeded.');
if(!/Request protection is not ready/.test(serverAccess)||!/status\s*:\s*503/.test(serverAccess))fail('Rate-limit backend failure must fail closed for privileged endpoints.');

const rateMigration=read('migrations/20260824_api_rate_limits.sql');
if(!/create table if not exists public\.api_rate_limits/i.test(rateMigration)||!/create or replace function public\.consume_api_rate_limit/i.test(rateMigration))fail('Rate-limit migration must define the durable counter table and atomic consumption function.');
if(!/revoke all on table public\.api_rate_limits from public, anon, authenticated/i.test(rateMigration))fail('Rate-limit counters must not be readable or writable by browser roles.');
if(!/revoke all on function public\.consume_api_rate_limit\(text,text,integer,integer\) from public, anon, authenticated/i.test(rateMigration)||!/grant execute on function public\.consume_api_rate_limit\(text,text,integer,integer\) to service_role/i.test(rateMigration))fail('Rate-limit RPC must be executable only by the service role.');
if(!/updated_at < v_now - interval '24 hours'/i.test(rateMigration))fail('Hashed abuse-control counters must retain the prelaunch target of approximately 24 hours or less.');

const core=read('server/diagnostic-core.js');
const diagnosticSubmissionMigration=read('migrations/20260826_atomic_diagnostic_response_submission.sql');
if(/question-bank-production|question-bank\.js|answerIndex\s*\}/i.test(core))fail('Secure diagnostic runtime must not source scoring content from the committed JavaScript question bank.');
if(/correct_answer\s*:\s*item\.answerIndex/.test(core))fail('Secure diagnostic must not persist the real answer key in browser-readable legacy response fields.');
if(!/response-scoring\.js/.test(core)||!/scoreResponse\(/.test(core))fail('Secure diagnostic runtime must use shared server-side MCQ/SPR scoring.');
const safeQuestion=core.match(/export function safeQuestion\([^)]*\)\{([^}]+)\}/s)?.[1]||'';
if(!safeQuestion)fail('Could not verify safeQuestion projection.');
else if(/answerIndex|explanation|distractor/i.test(safeQuestion))fail('safeQuestion must not expose answer/explanation fields.');
if(!/contentSystemReady\(\)/.test(core)||!/content_items\?select=id,content_type,qa_status,active,format&limit=1/.test(core))fail('Secure diagnostic must verify that the typed server-only content system is ready before creating/scoring secure attempts.');
if(!/diagnostic_responses\?select=content_item_id,selected_answer,response_text,scored_by_server&limit=1/.test(core))fail('Secure diagnostic readiness must require the SPR-capable trusted response schema.');
if(!/content_item_reviews\?select=item_id,review_type,decision,content_hash&limit=1/.test(core))fail('Secure diagnostic readiness must require the hash-pinned review schema.');
if(!/content_type=eq\.diagnostic&qa_status=eq\.production_approved&active=eq\.true/.test(core))fail('Secure diagnostic selection must be limited to active production-approved diagnostic content.');
if(!/usableFormat\(row\)/.test(core)||!/row\?\.format==='spr'&&row\?\.section==='MATH'/.test(core))fail('Secure diagnostic runtime must permit MCQ plus Math-only SPR content.');
if(!/row\.content_type==='diagnostic'/.test(core))fail('Secure diagnostic runtime must verify the returned content type before use.');
for(const review of ['accuracy','alignment','editorial','bias_accessibility','originality'])if(!core.includes(`'${review}'`))fail(`Secure diagnostic approval gate must require ${review} review.`);
if(!/content_answer_keys\?select=item_id,answer,explanation/.test(core)||!/content_item_reviews\?select=id,item_id,review_type,reviewer_label,decision,content_hash,created_at&order=created_at\.asc,id\.asc/.test(core))fail('Secure diagnostic plan creation must require scoring content and an ordered hash-pinned independent-review audit trail.');
if(!/byType\.set\(r\.review_type,r\)/.test(core)||!/r\?\.decision==='approve'/.test(core))fail('Secure diagnostic approval gate must use the latest decision for each required review type.');
if(!/databaseReviewContent\('diagnostic'/.test(core)||!/createHash\('sha256'\)/.test(core)||!/function runtimeContentHash/.test(core))fail('Secure diagnostic runtime must recompute the exact reviewed MCQ/SPR content hash before delivery/scoring.');
if(!/r\?\.content_hash===contentHash/.test(core))fail('Secure diagnostic approvals must match the recomputed current content hash.');
if(!/function approvedContent/.test(core)||!/changed after review/.test(core))fail('Secure diagnostic item delivery/scoring must fail closed when content changes after review.');
if(!/diagnostic_attempt_items/.test(core)||!/assertPersistedPlanItem/.test(core))fail('Secure diagnostic must persist and verify the server-selected item plan.');
if(!/content_answer_keys\?item_id=eq\./.test(core)||!/answer:key\.answer/.test(core))fail('Secure diagnostic scoring must retrieve scoring material through the server-only answer-key table.');
if(!/\/rest\/v1\/rpc\/submit_diagnostic_response_secure_v3/.test(core))fail('Secure diagnostic responses must be persisted through the atomic trusted submission RPC.');
if(!/p_question_key:item\.id/.test(core))fail('Secure diagnostic response submission must bind the server-selected content item to the trusted RPC.');
if(!/p_selected_answer:scored\.selectedAnswer/.test(core)||!/p_response_text:scored\.responseText/.test(core))fail('Secure diagnostic must pass one server-validated MCQ or SPR response shape to the trusted RPC.');
if(!/content_item_id[\s\S]*p_question_key[\s\S]*scored_by_server[\s\S]*true/i.test(diagnosticSubmissionMigration))fail('Atomic diagnostic response submission must link the content item and mark the persisted response server-scored.');
if(!/revoke all on function public\.submit_diagnostic_response_secure_v3[\s\S]*from public, anon, authenticated/i.test(diagnosticSubmissionMigration)||!/grant execute on function public\.submit_diagnostic_response_secure_v3[\s\S]*to service_role/i.test(diagnosticSubmissionMigration))fail('Atomic diagnostic response submission must remain service-role only.');
if(!/scored_by_server=eq\.true/.test(core))fail('Secure diagnostic progress/finalization must filter to server-scored rows.');
if(!/r\.content_item_id===r\.question_key/.test(core))fail('Secure diagnostic finalization must verify response/content-item identity.');

const contentMigration=read('migrations/20260824_content_system.sql');
if(!/content_type text not null check \(content_type in \('diagnostic','practice'\)\)/i.test(contentMigration))fail('Server content items must distinguish diagnostic and practice content types.');
if(!/format text not null check \(format in \('mcq','spr'\)\)/i.test(contentMigration))fail('Server content items must distinguish MCQ and SPR formats.');
if(!/add column if not exists content_item_id/i.test(contentMigration)||!/add column if not exists scored_by_server/i.test(contentMigration))fail('Content migration must add secure response provenance columns.');
if(!/content_hash text not null check \(content_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/i.test(contentMigration))fail('Content review records must be pinned to a 64-character SHA-256 content hash.');
if(!/review_type in \('accuracy','alignment','editorial','bias_accessibility','originality','psychometric'\)/i.test(contentMigration))fail('Content review schema must support the required originality review dimension.');
if(!/secure_v3_responses_server_only/i.test(contentMigration)||!/as\s+restrictive/i.test(contentMigration))fail('Content migration must contain the restrictive secure-v3 diagnostic response policy.');
if(!/coalesce\s*\(\s*da\.summary\s*->>\s*'engine'\s*,\s*'legacy'\s*\)\s*=\s*'secure-v3'/i.test(contentMigration))fail('Secure-v3 response policy must identify secure-v3 attempts from the server-authored attempt summary.');
for(const table of ['content_items','content_answer_keys','content_item_reviews','diagnostic_attempt_items'])if(!contentMigration.includes(`revoke all on table public.${table} from public, anon, authenticated;`))fail(`${table} must be explicitly revoked from browser roles.`);
if(/create policy\s+"diagnostic_plan_(student|parent)_read"/i.test(contentMigration))fail('The complete secure diagnostic plan must not have a browser SELECT policy.');
const sprMigration=read('migrations/20260824_spr_responses.sql');
if(!/diagnostic_responses[\s\S]*response_text text/i.test(sprMigration)||!/diagnostic_response_one_answer_shape/i.test(sprMigration))fail('Secure diagnostic schema must support exactly one MCQ or SPR response shape.');

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
console.log('Security invariant validation passed for protected MCQ/SPR diagnostic, guided practice, account, billing, content, privacy-minimized measurement, and durable abuse-control surfaces.');