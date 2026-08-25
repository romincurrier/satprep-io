import fs from 'node:fs';

const stripe=fs.readFileSync(new URL('../server/stripe-server.js',import.meta.url),'utf8');
const billingClient=fs.readFileSync(new URL('../billing.js',import.meta.url),'utf8');
const endpointNames=['billing-overview.js','create-checkout-session.js','confirm-checkout-session.js','create-portal-session.js'];
const endpoints=endpointNames.map(name=>({name,src:fs.readFileSync(new URL(`../api/${name}`,import.meta.url),'utf8')}));
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

const overview=endpoints.find(x=>x.name==='billing-overview.js')?.src||'';
for(const required of ["enforceRateLimit(auth.user.id,'billing/overview'","profile:{role:'parent',billing_owner:!!p.billing_owner}",'can_manage:!!sub.provider_customer_id',"p.role!=='parent'","billing_owner:false"]){
 if(!overview.includes(required))failures.push(`Billing overview must retain minimized server-side billing state: ${required}`);
}
for(const forbidden of ['provider_subscription_id:','provider_customer_id:sub.provider_customer_id','billing_profile_id:']){
 if(overview.includes(forbidden))failures.push(`Billing overview must not expose provider/internal identifiers: ${forbidden}`);
}
if(!billingClient.includes("authedPost('/api/billing-overview')"))failures.push('Billing browser must load account state through the trusted billing overview API.');
for(const forbidden of ['supabase.from("profiles")','supabase.from("subscriptions")','supabase.from("students")',"supabase.from('profiles')","supabase.from('subscriptions')","supabase.from('students')"]){
 if(billingClient.includes(forbidden))failures.push(`Billing browser must not directly read broad billing/account tables: ${forbidden}`);
}
if(!billingClient.includes('subscription?.can_manage'))failures.push('Billing browser must use the minimized can_manage flag instead of a provider customer identifier.');
if(!billingClient.includes('!["parent","admin"].includes(profile?.role)'))failures.push('Billing controls must remain hidden from non-billing roles in the browser.');

if(failures.length){
 console.error('Billing security validation failed:');
 for(const failure of failures)console.error(`- ${failure}`);
 process.exit(1);
}
console.log('Billing security validation passed.');
