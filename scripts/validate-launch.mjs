import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const index = read('index.html');
const marketing = read('marketing.js');
const marketingEvents = read('marketing-events.js');
const guard = read('prelaunch-guard.js');
const vercel = read('vercel.json');
const accessibility = read('public/accessibility.css');
const marketingEventApi = read('api/marketing-event.js');
const envExample = read('env.example');
const gates = JSON.parse(read('launch-gates.json'));
const trademarkGate = read('docs/TRADEMARK_LAUNCH_GATE.md');
const errors = [];
const requireText = (haystack, needle, label) => { if(!haystack.includes(needle)) errors.push(label); };
const forbid = (haystack, pattern, label) => { if(pattern.test(haystack)) errors.push(label); };

requireText(index,'src="/prelaunch-guard.js"','index.html must load prelaunch-guard.js.');
const guardPos=index.indexOf('src="/prelaunch-guard.js"'),billingPos=index.indexOf('src="/billing.js"'),measurementPos=index.indexOf('src="/marketing-events.js"');
if(guardPos<0||billingPos<0||guardPos>billingPos)errors.push('prelaunch-guard.js must load before billing.js so public billing URLs/clicks are gated before billing initialization.');
if(measurementPos<0||guardPos<0||guardPos>measurementPos)errors.push('prelaunch-guard.js must load before marketing-events.js so the disabled client measurement gate exists before tracking code initializes.');
forbid(index,/"offers"\s*:/,'Pre-launch SoftwareApplication JSON-LD must not publish an Offer before billing terms are approved.');
forbid(index,/"price"\s*:/,'Pre-launch structured data must not publish a price before billing terms are approved.');
requireText(guard,'const PUBLIC_BILLING_ENABLED = false','Prelaunch commercial gate must remain disabled until an explicit launch change.');
requireText(guard,'const PUBLIC_MARKETING_MEASUREMENT_ENABLED = false','Prelaunch client measurement gate must remain disabled until explicit privacy/analytics approval.');
requireText(guard,'window.__SATPREP_MARKETING_MEASUREMENT_ENABLED__ = PUBLIC_MARKETING_MEASUREMENT_ENABLED','Prelaunch guard must expose the disabled client measurement state before the tracking module loads.');
requireText(guard,"PUBLIC_HOSTS = new Set(['satprep.io','www.satprep.io'])",'Public billing gate must explicitly cover the production hosts.');
requireText(guard,'const BILLING_UI_ALLOWED = PUBLIC_BILLING_ENABLED || !IS_PUBLIC_HOST','Preview QA may remain available while public-host billing is gated.');
requireText(marketing,"fetch('/api/parent-setup-request'",'Under-13 setup requests must use the protected server endpoint natively.');
requireText(guard,"form.id !== 'teenForm'",'Teen signup must retain a defense-in-depth date-of-birth guard.');
requireText(guard,'age < 13','Teen signup must reject an entered date of birth indicating the learner is under 13.');
requireText(guard,"#billingBtn,.billing-checkout,#manageSubscription",'Public-host billing controls must be blocked during prelaunch.');
requireText(guard,"Public pricing and trial terms will be posted only after those launch checks are complete.",'Prelaunch pricing section must not imply unverified public billing terms.');

if(gates.college_board_trademark_review==='unresolved'){
  if(gates.public_indexing!=='disabled') errors.push('Public indexing must remain disabled until the College Board trademark launch gate is resolved.');
  if(gates.outbound_marketing!=='disabled') errors.push('Outbound marketing must remain disabled until the College Board trademark launch gate is resolved.');
  if(gates.public_billing!=='disabled') errors.push('Public billing must remain disabled until the College Board trademark launch gate is resolved.');
  requireText(trademarkGate,'current product name and domain contain `SAT`','Trademark launch-gate documentation must preserve the current naming/domain issue.');
  requireText(trademarkGate,'Do not copy or republish official College Board test questions','Trademark/content launch-gate documentation must preserve the official-content boundary.');
}
if(gates.live_payments!=='disabled') errors.push('Live payments must remain disabled in the committed prelaunch gate file.');
if(gates.first_party_measurement!=='disabled') errors.push('First-party marketing measurement must remain disabled until explicit privacy/analytics launch approval.');
requireText(envExample,'MARKETING_MEASUREMENT_ENABLED=false','env.example must keep first-party marketing measurement disabled by default.');
requireText(marketingEventApi,"process.env.MARKETING_MEASUREMENT_ENABLED",'Marketing measurement API must require an explicit server-side enable flag.');
requireText(marketingEventApi,"if(!MEASUREMENT_ENABLED)return json(res,404",'Marketing measurement API must fail closed while measurement is disabled.');
requireText(marketingEventApi,"if(!origin)return false",'Marketing measurement API must require an approved browser Origin rather than accepting originless submissions.');
requireText(marketingEventApi,"enforceRateLimit(networkSubject(req),'marketing/event'",'Marketing measurement API must use durable abuse controls before accepting anonymous events.');
requireText(marketingEventApi,'const EMAIL_LIKE=','Marketing measurement API must retain an email-like data filter.');
requireText(marketingEventApi,'const PHONE_LIKE=','Marketing measurement API must retain a phone-like data filter.');
requireText(marketingEventApi,'const noContactData=','Marketing measurement API must discard contact-like campaign values instead of persisting them.');
requireText(marketingEventApi,'utm_term:cleanFree','Free-form paid-keyword attribution must pass through the contact-data filter.');
requireText(marketingEvents,'function isPublicMarketingSurface()','Marketing tracking client must distinguish public acquisition surfaces from authenticated/billing application routes.');
requireText(marketingEvents,"p.get('app')!=='1'",'Marketing tracking client must not measure authenticated application mode.');
requireText(marketingEvents,"!p.has('openBilling')",'Marketing tracking client must not measure billing UI mode.');
requireText(marketingEvents,"window.__SATPREP_MARKETING_MEASUREMENT_ENABLED__!==true||!isPublicMarketingSurface()",'Marketing tracking client must refuse to send when either the launch gate is disabled or the current surface is not public marketing.');
requireText(marketingEvents,"if(window.__SATPREP_MARKETING_MEASUREMENT_ENABLED__===true&&isPublicMarketingSurface())installMarketingTracking()",'Marketing tracking client may self-install only after explicit client-gate enablement on a public marketing surface.');

requireText(vercel,'Content-Security-Policy','Production headers must include a Content-Security-Policy.');
requireText(vercel,"default-src 'self'",'Content-Security-Policy must default to same-origin resources.');
requireText(vercel,"object-src 'none'",'Content-Security-Policy must disable plugin/object content.');
requireText(vercel,"frame-ancestors 'none'",'Content-Security-Policy must prevent framing.');
requireText(vercel,'Strict-Transport-Security','Production headers must include HSTS.');
requireText(vercel,'Cross-Origin-Opener-Policy','Production headers must isolate the top-level browsing context.');
requireText(vercel,'X-Permitted-Cross-Domain-Policies','Production headers must disable legacy cross-domain policy files.');
requireText(vercel,'browsing-topics=()','Permissions-Policy must disable Topics API access.');
requireText(vercel,'payment=()','Permissions-Policy must disable browser Payment Request API while billing is prelaunch.');
requireText(vercel,'X-Robots-Tag','Prelaunch deployments must send an X-Robots-Tag header until explicit public indexing approval.');
requireText(vercel,'noindex, nofollow, noarchive','Prelaunch X-Robots-Tag must block indexing, link following, and cached copies.');

requireText(index,'href="/accessibility.css"','The application shell must load the accessibility stylesheet.');
requireText(index,'class="skip-link"','The application shell must include a keyboard skip link.');
requireText(index,'id="app" tabindex="-1"','The skip-link destination must be programmatically focusable.');
requireText(accessibility,':focus-visible','Keyboard users must receive a visible focus indicator.');
requireText(accessibility,'min-height:44px','Primary interactive controls must have a baseline touch-target size.');
requireText(accessibility,'prefers-reduced-motion:reduce','The UI must respect reduced-motion preferences.');
requireText(accessibility,'prefers-contrast:more','The UI must include a higher-contrast preference treatment.');

// Youth setup data must never be inserted directly from public browser code.
// Parent setup now goes through a rate-limited server endpoint; future youth-data
// collection must follow the same server-side authorization pattern.
const directBrowserInserts = [...marketing.matchAll(/supabase\.from\(["']([^"']+)["']\)\.insert/g)].map(m=>m[1]);
for(const table of directBrowserInserts) errors.push(`Direct browser insert into ${table} from marketing.js is prohibited.`);
forbid(marketing,/parent_setup_requests/,'marketing.js must not reference the parent_setup_requests table directly.');

if(errors.length){
  console.error('Launch validation failed:');
  for(const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Launch validation passed: public billing/indexing/outbound marketing/measurement remain gated, the unresolved trademark gate is enforced, youth setup uses the protected flow, first-party measurement is inert until explicitly enabled, public-surface only, origin-restricted, contact-like attribution values are discarded, anonymous measurement is rate-limited server-side, browser security headers are present, and baseline accessibility safeguards are loaded.');
