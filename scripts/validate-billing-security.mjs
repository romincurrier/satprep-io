import fs from 'node:fs';

const stripe=fs.readFileSync(new URL('../server/stripe-server.js',import.meta.url),'utf8');
const endpoints=['create-checkout-session.js','confirm-checkout-session.js','create-portal-session.js'].map(name=>({name,src:fs.readFileSync(new URL(`../api/${name}`,import.meta.url),'utf8')}));
const failures=[];
const requireStripe=(text,label)=>{if(!stripe.includes(text))failures.push(label)};

requireStripe('export function assertBillingRequestOrigin(req)','Billing server must expose a shared mutation-origin guard.');
requireStripe("req?.headers?.origin",'Billing origin guard must inspect the browser Origin header.');
requireStripe("req?.headers?.['sec-fetch-site']",'Billing origin guard must inspect Sec-Fetch-Site when present.');
requireStripe("if(!rawOrigin){if(isPublicHost(req))",'Public billing mutations must fail closed when Origin is missing.');
requireStripe("origin.hostname.toLowerCase()!==host",'Billing origin guard must require the browser origin host to match the request host.');
requireStripe("origin.protocol!=='https:'",'Billing origin guard must require HTTPS outside localhost development.');

for(const {name,src} of endpoints){
 if(!src.includes('assertBillingRequestOrigin'))failures.push(`${name} must import the shared billing origin guard.`);
 const originCall=src.indexOf('assertBillingRequestOrigin(req)');
 const authCall=src.indexOf('billingContext(req)');
 if(originCall<0||authCall<0||originCall>authCall)failures.push(`${name} must verify origin before loading authenticated billing context.`);
 if(!src.includes("req.method!=='POST'"))failures.push(`${name} must remain POST-only.`);
}

if(failures.length){
 console.error('Billing security validation failed:');
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Billing security validation passed.');
