import fs from 'node:fs';
import {assertAppRequestOrigin,assertAppReadOrigin} from '../server/supabase-server.js';

const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const server=read('../server/supabase-server.js');
const mutationTargets=new Map([
 ['student activation',read('../api/activate-student-login.js')],
 ['parent student creation',read('../api/parent-student.js')],
 ['student parent invitation',read('../api/student-parent-invitation.js')],
 ['parent invitation acceptance',read('../api/parent-invitations.js')],
 ['parent setup request',read('../api/parent-setup-request.js')],
 ['privacy request creation',read('../api/privacy-request.js')],
 ['diagnostic session creation',read('../api/diagnostic-session-v3.js')],
 ['diagnostic scoring',read('../api/diagnostic-answer-v3.js')],
 ['guided-practice session creation',read('../api/practice-session-v3.js')],
 ['guided-practice scoring',read('../api/practice-answer-v3.js')]
]);
const readTargets=new Map([
 ['diagnostic item read',read('../api/diagnostic-item-v3.js')],
 ['guided-practice item read',read('../api/practice-item-v3.js')]
]);
const failures=[];
const requireText=(text,needle,label)=>{if(!text.includes(needle))failures.push(label)};
const expectAllowed=(fn,req,label)=>{try{fn(req)}catch(e){failures.push(`${label}: unexpectedly rejected (${e.message}).`)}};
const expectRejected=(fn,req,label)=>{try{fn(req);failures.push(`${label}: unexpectedly allowed.`)}catch(e){if(e.status!==403)failures.push(`${label}: rejected with ${e.status||'unknown'} instead of 403.`)}};
const req=(headers={})=>({headers});

requireText(server,"const PUBLIC_APP_HOSTS=new Set(['satprep.io','www.satprep.io'])",'Shared origin guards must explicitly identify the public application hosts.');
requireText(server,"['same-origin','none'].includes(fetchSite)",'Shared origin verification must reject cross-site Sec-Fetch-Site values.');
requireText(server,"if(!rawOrigin){if(PUBLIC_APP_HOSTS.has(host))",'Mutating public application requests must fail closed when Origin is missing.');
requireText(server,"export function assertAppReadOrigin(req)",'Server must provide a browser-compatible same-origin guard for proprietary GET reads.');
requireText(server,"PUBLIC_APP_HOSTS.has(host)&&fetchSite!=='same-origin'",'Public proprietary GET reads without Origin must require Sec-Fetch-Site: same-origin.');
requireText(server,'verifyExplicitOrigin(host,rawOrigin)','Explicit origins must share the strict host/protocol verifier across read and mutation guards.');
requireText(server,"if(!host||hostname!==host)",'Origin hostname must match the request host, including preview deployments.');
requireText(server,"origin.protocol!=='https:'",'Non-local application origins must require HTTPS.');
requireText(server,".setHeader('Vary','Authorization, Origin')",'API responses must vary on both authorization and origin.');

for(const [label,source] of mutationTargets){
 requireText(source,'assertAppRequestOrigin',`${label} must import the strict application-origin guard.`);
 requireText(source,'assertAppRequestOrigin(req)',`${label} must invoke the strict application-origin guard.`);
}
for(const [label,source] of readTargets){
 requireText(source,'assertAppReadOrigin',`${label} must import the proprietary-read origin guard.`);
 requireText(source,'assertAppReadOrigin(req)',`${label} must invoke the proprietary-read origin guard.`);
 if(source.includes('assertAppRequestOrigin(req)'))failures.push(`${label} must not use the mutation-only guard because normal same-origin browser GET requests may omit Origin.`);
}

const parentSetup=mutationTargets.get('parent setup request');
if(parentSetup.includes('allowedOrigin('))failures.push('Parent setup must not retain the legacy permissive origin helper.');
if(parentSetup.includes("endsWith('.vercel.app')"))failures.push('Parent setup must not trust arbitrary vercel.app origins; preview requests must be same-host.');

for(const [label,source] of [['parent invitation acceptance',mutationTargets.get('parent invitation acceptance')],['privacy request creation',mutationTargets.get('privacy request creation')]]){
 requireText(source,"if(req.method==='POST')assertAppRequestOrigin(req)",`${label} must guard the mutating POST without unnecessarily blocking the authenticated GET path.`);
}

for(const label of ['diagnostic session creation','diagnostic scoring','guided-practice session creation','guided-practice scoring']){
 const source=mutationTargets.get(label);
 const guardIndex=source.indexOf('assertAppRequestOrigin(req)');
 const contextIndex=source.indexOf('studentContext(req)');
 if(guardIndex<0||contextIndex<0||guardIndex>contextIndex)failures.push(`${label} must reject untrusted browser origins before loading student context or mutating trusted learning state.`);
}
for(const [label,source] of readTargets){
 const guardIndex=source.indexOf('assertAppReadOrigin(req)');
 const contextIndex=source.indexOf('studentContext(req)');
 if(guardIndex<0||contextIndex<0||guardIndex>contextIndex)failures.push(`${label} must reject untrusted browser origins before loading student context or proprietary learning content.`);
}

expectRejected(assertAppRequestOrigin,req({host:'satprep.io','sec-fetch-site':'same-origin'}),'Public mutation without Origin');
expectAllowed(assertAppRequestOrigin,req({host:'satprep.io',origin:'https://satprep.io','sec-fetch-site':'same-origin'}),'Public mutation with matching HTTPS Origin');
expectRejected(assertAppRequestOrigin,req({host:'satprep.io',origin:'https://evil.example','sec-fetch-site':'cross-site'}),'Cross-site public mutation');
expectAllowed(assertAppReadOrigin,req({host:'satprep.io','sec-fetch-site':'same-origin'}),'Same-origin public GET without Origin');
expectAllowed(assertAppReadOrigin,req({host:'satprep.io',origin:'https://satprep.io','sec-fetch-site':'same-origin'}),'Same-origin public GET with Origin');
expectRejected(assertAppReadOrigin,req({host:'satprep.io','sec-fetch-site':'cross-site'}),'Cross-site public GET');
expectRejected(assertAppReadOrigin,req({host:'satprep.io'}),'Signal-less public GET');
expectRejected(assertAppReadOrigin,req({host:'satprep.io',origin:'https://evil.example','sec-fetch-site':'same-origin'}),'Mismatched explicit public GET Origin');
expectAllowed(assertAppReadOrigin,req({host:'localhost:5173','sec-fetch-site':'same-origin'}),'Local same-origin GET');

if(failures.length){
 console.error('Application origin validation failed:');
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Application origin validation passed.');
