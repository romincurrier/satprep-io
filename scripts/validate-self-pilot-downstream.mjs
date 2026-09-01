import fs from 'node:fs';

const source=fs.readFileSync('api/full-browser-self-pilot-downstream.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const errors=[];
const need=(pattern,message)=>{if(!pattern.test(source))errors.push(message)};
const forbid=(pattern,message)=>{if(pattern.test(source))errors.push(message)};

need(/Sandbox\.create\(/,'Downstream pilot must drive a real browser in Vercel Sandbox.');
need(/sandbox\.stop\(\)/,'Downstream pilot must stop its browser sandbox.');
need(/user-agent[^\n]+vercel-cron/,'Downstream pilot auto mode must require a Vercel Cron invocation.');
need(/selfpilot\\\.parent/,'Downstream parent identity must stay in the reserved selfpilot namespace.');
need(/@satprep\\\.io/,'Downstream synthetic identities must remain project-owned satprep.io addresses.');
need(/\/auth\/v1\/admin\/users/,'Test-only fallback provisioning must use the server-side Auth admin boundary.');
need(/signup_checkpoint:'blocked_by_auth_email_rate_limit'/,'Downstream continuation must preserve the real signup failure rather than convert it to a pass.');
need(/browser_parent_signup_screen[^\n]+pass:false/,'Downstream continuation must not report prior signup-screen evidence as a current-run pass.');
need(/browser_parent_signup_completion[^\n]+pass:false/,'Normal parent signup completion must remain a failed checkpoint while the email limiter blocks it.');
need(/filter\(x=>!\['browser_parent_signup_screen','browser_parent_signup_completion'\]\.includes\(x\.name\)\)/,'Downstream status must exclude both unexecuted signup checkpoints rather than count historical evidence in a current run.');
need(/#childFirst/,'Downstream pilot must exercise child creation UI.');
need(/#activateStudentConfirm/,'Downstream pilot must exercise student activation UI.');
need(/#onboard/,'Downstream pilot must exercise learner onboarding UI.');
need(/#startDiagnostic|#secureDiagStart/,'Downstream pilot must exercise diagnostic UI.');
need(/#learningV2Dashboard/,'Downstream pilot must verify adaptive learning UI.');
need(/#learningV2Teach/,'Downstream pilot must verify teaching material UI.');
need(/#learningV2Practice|#learningV3Practice/,'Downstream pilot must exercise practice UI.');
need(/#journeyMini/,'Downstream pilot must verify Journey UI.');
need(/browser_parent_progress_visibility/,'Downstream pilot must return to the parent dashboard.');
need(/content_items\?select=id,active,qa_status/,'Downstream report must inspect current content activation fields.');
need(/subscriptions\?household_id/,'Downstream report must verify billing isolation.');
need(/status:downstreamPass\?'completed':'revoked'/,'Downstream execution must close its pilot enrollment after one run.');

forbid(/content_items[^\n]+method:/,'Downstream pilot must never mutate commercial content.');
forbid(/subscriptions[^\n]+method:/,'Downstream pilot must never mutate billing state.');
forbid(/production_approved\s*[:=]\s*true/,'Downstream pilot must never approve content.');
forbid(/public_indexing|live_payments|public_billing|marketing_measurement|outbound_marketing[^\n]*true/i,'Downstream pilot must never activate launch gates.');

if(pkg.dependencies?.['@vercel/sandbox']!=='3.2.0')errors.push('@vercel/sandbox must remain pinned to 3.2.0.');
if(vercel.functions?.['api/full-browser-self-pilot-downstream.js']?.maxDuration!==300)errors.push('Downstream browser function must have a bounded 300-second duration.');

if(errors.length){for(const error of errors)console.error(`Downstream self-pilot validation error: ${error}`);process.exit(1)}
console.log('Downstream browser self-pilot guard passed: test-only provisioning, fresh current-run evidence accounting, real browser coverage, preserved signup failure, billing/content isolation, and one-shot enrollment closure are enforced.');