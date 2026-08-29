import fs from 'node:fs';

const source=fs.readFileSync('api/full-browser-self-pilot.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const errors=[];
const need=(pattern,message)=>{if(!pattern.test(source))errors.push(message)};
const forbid=(pattern,message)=>{if(pattern.test(source))errors.push(message)};

need(/Sandbox\.create\(/,'Self-pilot must execute the rendered browser in Vercel Sandbox.');
need(/sandbox\.stop\(\)/,'Self-pilot must stop its ephemeral browser sandbox.');
need(/agent-browser/,'Self-pilot must drive a real browser rather than substitute API-only simulation.');
need(/pilotEnrollmentByToken\(token\)/,'Token-triggered self-pilot must validate the one-time pilot enrollment.');
need(/cronEnrollment\(\)/,'Cron-triggered self-pilot must select only the explicitly reserved open pilot enrollment.');
need(/CRON_LABEL=['"]Live Family Pilot #1['"]/,'Cron execution must be pinned to the single reserved pilot label.');
need(/user-agent[^\n]+vercel-cron/,'Cron auto mode must require the Vercel Cron user agent in addition to auto=1.');
need(/status=eq\.open&parent_profile_id=is\.null&household_id=is\.null&student_id=is\.null/,'Cron mode must select only a fresh unattached open enrollment.');
need(/enrollment\.status!==['"]open['"]/,'Self-pilot must start only from a fresh open enrollment.');
need(/parent_profile_id\|\|enrollment\.household_id\|\|enrollment\.student_id/,'Self-pilot must reject an invitation already attached to a family.');
need(/selfpilot\.parent\.\$\{id\}@example\.com/,'Parent identity must be a deterministic reserved example.com test address.');
need(/selfpilot\.student\.\$\{id\}@example\.com/,'Student identity must be a deterministic reserved example.com test address.');
need(/endsWith\(['"]@example\.com['"]\)/,'Synthetic confirmation/attachment paths must be limited to reserved example.com identities.');
need(/#parentForm/,'Self-pilot must use the normal rendered parent signup form.');
need(/#childFirst/,'Self-pilot must use the normal rendered child setup form.');
need(/#activateStudentConfirm/,'Self-pilot must use the parent student-login activation UI.');
need(/#onboard/,'Self-pilot must complete the rendered learner-profile onboarding.');
need(/#startDiagnostic|#secureDiagStart/,'Self-pilot must enter the rendered diagnostic.');
need(/#learningV2Dashboard/,'Self-pilot must verify the personalized learning dashboard.');
need(/#learningV2Teach/,'Self-pilot must open instructional material before practice.');
need(/#learningV2Practice|#learningV3Practice/,'Self-pilot must exercise rendered guided practice.');
need(/#journeyMini/,'Self-pilot must verify Journey progress in the rendered UI.');
need(/browser_parent_progress_visibility/,'Self-pilot must return to the parent role and verify progress visibility.');
need(/commercial_content:\{rows:content\.length,active:activeContent\.length,production_approved:approvedContent\.length\}/,'Self-pilot report must verify commercial content gates remained empty.');
need(/subscription_rows:subs\.length/,'Self-pilot report must verify no pilot billing subscription was created.');
need(/email_confirm:true/,'Email-confirmation bypass must be limited to the already-created synthetic parent needed for autonomous browser testing.');
need(/self_pilot_report/,'Self-pilot must persist a sanitized report to the pilot ledger for independent verification.');

forbid(/service\([^\n]*content_items[^\n]*\{\s*method\s*:/,'Self-pilot must never mutate commercial content_items.');
forbid(/service\([^\n]*subscriptions[^\n]*\{\s*method\s*:/,'Self-pilot must never mutate subscription/billing state.');
forbid(/production_approved\s*[:=]\s*true|qa_status\s*[:=]\s*['"]production_approved['"]/,'Self-pilot must never approve content.');
forbid(/\/auth\/v1\/admin\/users['"`][^\n]*method:['"]POST['"]/,'Self-pilot must not create users through the admin Auth API; the parent must use the normal signup form.');
forbid(/live_payments|public_billing|public_indexing|marketing_measurement|outbound_marketing[^\n]*true/i,'Self-pilot must not enable commercial launch gates.');

if(pkg.dependencies?.['@vercel/sandbox']!=='3.2.0')errors.push('@vercel/sandbox must remain pinned to the reviewed 3.2.0 release for this pilot runner.');
const duration=vercel.functions?.['api/full-browser-self-pilot.js']?.maxDuration;
if(duration!==300)errors.push('Full browser self-pilot function must retain a bounded 300-second maximum duration.');
const cron=(vercel.crons||[]).find(x=>x.path==='/api/full-browser-self-pilot?auto=1');
if(!cron||cron.schedule!=='* * * * *')errors.push('One-shot execution window must use the explicit every-minute Vercel Cron trigger until the first report is captured, then the cron must be removed.');

if(errors.length){for(const error of errors)console.error(`Full browser self-pilot validation error: ${error}`);process.exit(1)}
console.log('Full browser self-pilot guard passed: real-browser execution, one-shot Vercel Cron gating, reserved test identities, report persistence, no commercial content/billing mutation, and parent/student/Journey checkpoints are enforced.');
