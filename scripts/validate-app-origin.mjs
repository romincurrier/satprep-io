import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const server=read('../server/supabase-server.js');
const targets=new Map([
 ['student activation',read('../api/activate-student-login.js')],
 ['parent student creation',read('../api/parent-student.js')],
 ['student parent invitation',read('../api/student-parent-invitation.js')],
 ['parent invitation acceptance',read('../api/parent-invitations.js')],
 ['parent setup request',read('../api/parent-setup-request.js')],
 ['privacy request creation',read('../api/privacy-request.js')],
 ['diagnostic session creation',read('../api/diagnostic-session-v3.js')],
 ['diagnostic item read',read('../api/diagnostic-item-v3.js')],
 ['diagnostic scoring',read('../api/diagnostic-answer-v3.js')],
 ['guided-practice session creation',read('../api/practice-session-v3.js')],
 ['guided-practice item read',read('../api/practice-item-v3.js')],
 ['guided-practice scoring',read('../api/practice-answer-v3.js')]
]);
const failures=[];
const requireText=(text,needle,label)=>{if(!text.includes(needle))failures.push(label)};

requireText(server,"const PUBLIC_APP_HOSTS=new Set(['satprep.io','www.satprep.io'])",'Shared origin guard must explicitly identify the public application hosts.');
requireText(server,"['same-origin','none'].includes(fetchSite)",'Shared origin guard must reject cross-site Sec-Fetch-Site values.');
requireText(server,"if(!rawOrigin){if(PUBLIC_APP_HOSTS.has(host))",'Public application requests must fail closed when Origin is missing.');
requireText(server,"if(!host||hostname!==host)",'Origin hostname must match the request host, including preview deployments.');
requireText(server,"origin.protocol!=='https:'",'Non-local application origins must require HTTPS.');
requireText(server,".setHeader('Vary','Authorization, Origin')",'API responses must vary on both authorization and origin.');

for(const [label,source] of targets){
 requireText(source,'assertAppRequestOrigin',`${label} must import the shared application-origin guard.`);
 requireText(source,'assertAppRequestOrigin(req)',`${label} must invoke the shared application-origin guard.`);
}

const parentSetup=targets.get('parent setup request');
if(parentSetup.includes('allowedOrigin('))failures.push('Parent setup must not retain the legacy permissive origin helper.');
if(parentSetup.includes("endsWith('.vercel.app')"))failures.push('Parent setup must not trust arbitrary vercel.app origins; preview requests must be same-host.');

for(const [label,source] of [['parent invitation acceptance',targets.get('parent invitation acceptance')],['privacy request creation',targets.get('privacy request creation')]]){
 requireText(source,"if(req.method==='POST')assertAppRequestOrigin(req)",`${label} must guard the mutating POST without unnecessarily blocking the authenticated GET path.`);
}

for(const label of ['diagnostic session creation','diagnostic item read','diagnostic scoring','guided-practice session creation','guided-practice item read','guided-practice scoring']){
 const source=targets.get(label);
 const guardIndex=source.indexOf('assertAppRequestOrigin(req)');
 const contextIndex=source.indexOf('studentContext(req)');
 if(guardIndex<0||contextIndex<0||guardIndex>contextIndex)failures.push(`${label} must reject untrusted browser origins before loading student context or trusted learning content/state.`);
}

if(failures.length){
 console.error('Application origin validation failed:');
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Application origin validation passed.');
