import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const index = read('index.html');
const marketing = read('marketing.js');
const guard = read('prelaunch-guard.js');
const vercel = read('vercel.json');
const accessibility = read('public/accessibility.css');
const errors = [];
const requireText = (haystack, needle, label) => { if(!haystack.includes(needle)) errors.push(label); };
const forbid = (haystack, pattern, label) => { if(pattern.test(haystack)) errors.push(label); };

requireText(index,'src="/prelaunch-guard.js"','index.html must load prelaunch-guard.js.');
const guardPos=index.indexOf('src="/prelaunch-guard.js"'),billingPos=index.indexOf('src="/billing.js"');
if(guardPos<0||billingPos<0||guardPos>billingPos)errors.push('prelaunch-guard.js must load before billing.js so public billing URLs/clicks are gated before billing initialization.');
forbid(index,/"offers"\s*:/,'Pre-launch SoftwareApplication JSON-LD must not publish an Offer before billing terms are approved.');
forbid(index,/"price"\s*:/,'Pre-launch structured data must not publish a price before billing terms are approved.');
requireText(guard,'const PUBLIC_BILLING_ENABLED = false','Prelaunch commercial gate must remain disabled until an explicit launch change.');
requireText(guard,"PUBLIC_HOSTS = new Set(['satprep.io','www.satprep.io'])",'Public billing gate must explicitly cover the production hosts.');
requireText(guard,'const BILLING_UI_ALLOWED = PUBLIC_BILLING_ENABLED || !IS_PUBLIC_HOST','Preview QA may remain available while public-host billing is gated.');
requireText(guard,"fetch('/api/parent-setup-request'",'Under-13 setup requests must use the protected server endpoint.');
requireText(guard,"event.stopImmediatePropagation()",'Youth/billing guards must stop legacy handlers when required.');
requireText(guard,"form.id === 'teenForm'",'Teen signup must be guarded by date-of-birth validation.');
requireText(guard,'age < 13','Teen signup must reject an entered date of birth indicating the learner is under 13.');
requireText(guard,"#billingBtn,.billing-checkout,#manageSubscription",'Public-host billing controls must be blocked during prelaunch.');
requireText(guard,"Public pricing and trial terms will be posted only after those launch checks are complete.",'Prelaunch pricing section must not imply unverified public billing terms.');

requireText(vercel,'Content-Security-Policy','Production headers must include a Content-Security-Policy.');
requireText(vercel,"default-src 'self'",'Content-Security-Policy must default to same-origin resources.');
requireText(vercel,"object-src 'none'",'Content-Security-Policy must disable plugin/object content.');
requireText(vercel,"frame-ancestors 'none'",'Content-Security-Policy must prevent framing.');
requireText(vercel,'Strict-Transport-Security','Production headers must include HSTS.');
requireText(vercel,'Cross-Origin-Opener-Policy','Production headers must isolate the top-level browsing context.');
requireText(vercel,'X-Permitted-Cross-Domain-Policies','Production headers must disable legacy cross-domain policy files.');
requireText(vercel,'browsing-topics=()','Permissions-Policy must disable Topics API access.');
requireText(vercel,'payment=()','Permissions-Policy must disable browser Payment Request API while billing is prelaunch.');

requireText(index,'href="/accessibility.css"','The application shell must load the accessibility stylesheet.');
requireText(index,'class="skip-link"','The application shell must include a keyboard skip link.');
requireText(index,'id="app" tabindex="-1"','The skip-link destination must be programmatically focusable.');
requireText(accessibility,':focus-visible','Keyboard users must receive a visible focus indicator.');
requireText(accessibility,'min-height:44px','Primary interactive controls must have a baseline touch-target size.');
requireText(accessibility,'prefers-reduced-motion:reduce','The UI must respect reduced-motion preferences.');
requireText(accessibility,'prefers-contrast:more','The UI must include a higher-contrast preference treatment.');

// The old direct browser insert may remain temporarily for backwards compatibility, but the capture-phase
// guard above must intercept it. Treat any new direct writes to other youth setup tables as a build failure.
const directYouthWrites = [...marketing.matchAll(/supabase\.from\(["']([^"']+)["']\)\.insert/g)].map(m=>m[1]);
for(const table of directYouthWrites){
  if(table !== 'parent_setup_requests') errors.push(`Unexpected direct browser insert into ${table} from marketing.js.`);
}

if(errors.length){
  console.error('Launch validation failed:');
  for(const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Launch validation passed: public billing is gated, youth setup uses the protected flow, browser security headers are present, and baseline accessibility safeguards are loaded.');
