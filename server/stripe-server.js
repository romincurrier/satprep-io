import {authenticatedUser,service} from './supabase-server.js';

const PUBLIC_HOSTS=new Set(['satprep.io','www.satprep.io']);
function requestHost(req){
 const raw=String(req?.headers?.['x-forwarded-host']||req?.headers?.host||'').split(',')[0].trim().toLowerCase();
 return raw.replace(/:\d+$/,'');
}
function isPublicHost(req){return PUBLIC_HOSTS.has(requestHost(req))}
function enabled(name){return String(process.env[name]||'').toLowerCase()==='true'}

export function stripeSecret(){
 const secret=String(process.env.STRIPE_SECRET_KEY||'');
 if(!secret)throw Object.assign(new Error('Billing provider is not configured.'),{status:503});
 if(secret.startsWith('sk_live_')&&!enabled('ALLOW_LIVE_BILLING'))throw Object.assign(new Error('Live billing is intentionally disabled.'),{status:503});
 if(!secret.startsWith('sk_test_')&&!secret.startsWith('sk_live_'))throw Object.assign(new Error('Billing provider key is not recognized.'),{status:503});
 return secret;
}
export function billingMode(){const s=stripeSecret();return s.startsWith('sk_live_')?'live':'test'}

function assertPublicBillingMode(req,flag,label){
 if(!isPublicHost(req))return;
 if(!enabled(flag))throw Object.assign(new Error(`${label} is not available while SATprep.io is in pre-launch validation.`),{status:503});
 const mode=billingMode();
 if(mode!=='live'&&!enabled('ALLOW_PUBLIC_TEST_BILLING'))throw Object.assign(new Error('Public billing is not configured for live transactions.'),{status:503});
}

// Server-side launch controls. The browser guard is UX only; these are the authority.
// Preview/non-public hosts remain available for Stripe test-mode QA.
export function assertCheckoutSurfaceEnabled(req){assertPublicBillingMode(req,'PUBLIC_BILLING_ENABLED','Checkout')}
export function assertBillingPortalEnabled(req){assertPublicBillingMode(req,'PUBLIC_BILLING_PORTAL_ENABLED','Billing management')}

export async function stripeRequest(method,path,params={}){
 const secret=stripeSecret(),url=new URL(`https://api.stripe.com/v1/${path}`),options={method,headers:{Authorization:`Bearer ${secret}`}};
 if(method==='GET'){for(const [k,v] of Object.entries(params))if(v!=null)url.searchParams.append(k,String(v))}
 else{options.headers['Content-Type']='application/x-www-form-urlencoded';options.body=new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null).map(([k,v])=>[k,String(v)]))}
 const r=await fetch(url,options),data=await r.json().catch(()=>({}));
 if(!r.ok){console.error('stripe request failed',method,path,r.status,data?.error?.type||'',data?.error?.code||'');const e=new Error('Billing provider request failed.');e.status=r.status;throw e}
 return data;
}
export async function billingContext(req){
 const auth=await authenticatedUser(req);if(!auth?.user)return null;
 const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,email,first_name,last_name,role,household_id,billing_owner`),profile=rows?.[0]||null;
 return{...auth,profile};
}
export function safeSiteOrigin(){
 const raw=String(process.env.SITE_URL||'https://satprep.io').trim();
 try{const u=new URL(raw);if(u.protocol!=='https:'&&u.hostname!=='localhost'&&u.hostname!=='127.0.0.1')throw new Error();return `${u.origin}${u.pathname==='/'?'':u.pathname.replace(/\/$/,'')}`}catch{return'https://satprep.io'}
}
