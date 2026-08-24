import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),errors=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>errors.push(m);

const index=read('index.html');
if(/diagnostic-feedback\.js/i.test(index))fail('Diagnostic feedback must not be loaded during assessment.');
if(/marketing-events\.js/i.test(index))fail('Marketing measurement is gated until its migration/privacy review are complete.');
if(fs.existsSync(path.join(root,'api/billing-status.js')))fail('Public billing/environment configuration diagnostic endpoint must not ship.');

const router=read('diagnostic-router.js');
if(/question-bank-production|question-bank\.js|answerIndex|correct_answer/i.test(router))fail('Secure diagnostic client must not import or reference diagnostic answer keys.');

const itemApi=read('api/diagnostic-item-v3.js');
if(!/enforceCurrent\s*:\s*true/.test(itemApi))fail('Secure diagnostic item delivery must enforce the current unanswered position.');

const core=read('server/diagnostic-core.js');
if(/correct_answer\s*:\s*item\.answerIndex/.test(core))fail('Secure diagnostic must not persist the real answer key in browser-readable legacy response fields.');
const safeQuestion=core.match(/export function safeQuestion\([^)]*\)\{([^}]+)\}/s)?.[1]||'';
if(!safeQuestion)fail('Could not verify safeQuestion projection.');
else if(/answerIndex|explanation|distractor/i.test(safeQuestion))fail('safeQuestion must not expose answer/explanation fields.');

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
for(const key of ['strict-transport-security','x-content-type-options','x-frame-options','referrer-policy','permissions-policy'])if(!headerKeys.has(key))fail(`vercel.json missing baseline security header: ${key}`);

if(errors.length){for(const e of errors)console.error(`Security validation error: ${e}`);process.exit(1)}
console.log('Security invariant validation passed.');
