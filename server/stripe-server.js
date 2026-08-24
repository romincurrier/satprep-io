import {authenticatedUser,service} from './supabase-server.js';

export function stripeSecret(){
 const secret=String(process.env.STRIPE_SECRET_KEY||'');
 if(!secret)throw Object.assign(new Error('Billing provider is not configured.'),{status:503});
 if(secret.startsWith('sk_live_')&&process.env.ALLOW_LIVE_BILLING!=='true')throw Object.assign(new Error('Live billing is intentionally disabled.'),{status:503});
 if(!secret.startsWith('sk_test_')&&!secret.startsWith('sk_live_'))throw Object.assign(new Error('Billing provider key is not recognized.'),{status:503});
 return secret;
}
export function billingMode(){const s=stripeSecret();return s.startsWith('sk_live_')?'live':'test'}
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
