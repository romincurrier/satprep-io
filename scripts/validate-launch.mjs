import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const index = read('index.html');
const marketing = read('marketing.js');
const guard = read('prelaunch-guard.js');
const errors = [];
const requireText = (haystack, needle, label) => { if(!haystack.includes(needle)) errors.push(label); };
const forbid = (haystack, pattern, label) => { if(pattern.test(haystack)) errors.push(label); };

requireText(index,'src="/prelaunch-guard.js"','index.html must load prelaunch-guard.js.');
forbid(index,/"offers"\s*:/,'Pre-launch SoftwareApplication JSON-LD must not publish an Offer before billing terms are approved.');
forbid(index,/"price"\s*:/,'Pre-launch structured data must not publish a price before billing terms are approved.');
requireText(guard,'const PUBLIC_BILLING_ENABLED = false','Prelaunch commercial gate must remain disabled until an explicit launch change.');
requireText(guard,"fetch('/api/parent-setup-request'",'Under-13 setup requests must use the protected server endpoint.');
requireText(guard,"event.stopImmediatePropagation()",'Youth setup guard must stop the legacy direct-submit handler before it can write from the browser.');
requireText(guard,"form.id === 'teenForm'",'Teen signup must be guarded by date-of-birth validation.');
requireText(guard,'age < 13','Teen signup must reject an entered date of birth indicating the learner is under 13.');
requireText(guard,"Public pricing and trial terms will be posted only after those launch checks are complete.",'Prelaunch pricing section must not imply unverified public billing terms.');

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
console.log('Launch validation passed: prelaunch pricing claims are gated and youth setup is intercepted through the protected API flow.');
