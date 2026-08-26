import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = message => errors.push(message);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const PRODUCTION_SUPABASE_HOST = 'ataaiocpbjavmdpgmzlv.supabase.co';
const RETIRED_SUPABASE_HOST = 'nrjqykfrnfrgyuvprwob.supabase.co';

let vercel;
try {
  vercel = JSON.parse(read('vercel.json'));
} catch (error) {
  console.error(`Deployment security validation error: vercel.json is not valid JSON (${error.message}).`);
  process.exit(1);
}

const headerRows = (vercel.headers || []).flatMap(row => row.headers || []);
const headers = new Map(headerRows.map(row => [String(row.key || '').toLowerCase(), String(row.value || '')]));
const csp = headers.get('content-security-policy') || '';
const robots = headers.get('x-robots-tag') || '';

if (!csp.includes(`https://${PRODUCTION_SUPABASE_HOST}`)) {
  fail(`CSP connect-src must permit the production Supabase HTTPS origin (${PRODUCTION_SUPABASE_HOST}).`);
}
if (!csp.includes(`wss://${PRODUCTION_SUPABASE_HOST}`)) {
  fail(`CSP connect-src must permit the production Supabase realtime WSS origin (${PRODUCTION_SUPABASE_HOST}).`);
}
if (csp.includes(RETIRED_SUPABASE_HOST)) {
  fail(`CSP must not retain the retired/inactive Supabase origin (${RETIRED_SUPABASE_HOST}).`);
}
if (/https:\/\/\*\.supabase\.co|wss:\/\/\*\.supabase\.co/i.test(csp)) {
  fail('CSP must not broaden Supabase connectivity to a wildcard origin.');
}
if (!/object-src\s+'none'/i.test(csp)) fail("CSP must keep object-src 'none'.");
if (!/frame-ancestors\s+'none'/i.test(csp)) fail("CSP must keep frame-ancestors 'none'.");
if (/unsafe-eval/i.test(csp)) fail("CSP must not permit 'unsafe-eval'.");

for (const token of ['noindex', 'nofollow', 'noarchive']) {
  if (!robots.toLowerCase().includes(token)) fail(`Prelaunch X-Robots-Tag must retain ${token}.`);
}

const permissions = headers.get('permissions-policy') || '';
for (const feature of ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()']) {
  if (!permissions.includes(feature)) fail(`Permissions-Policy must retain ${feature}.`);
}

if (errors.length) {
  for (const error of errors) console.error(`Deployment security validation error: ${error}`);
  process.exit(1);
}

console.log('Deployment security validation passed for production Supabase connectivity and prelaunch browser controls.');
