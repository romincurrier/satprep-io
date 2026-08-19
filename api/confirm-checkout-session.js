async function stripeGet(path,params={}){
  const secret=process.env.STRIPE_SECRET_KEY;
  if(!secret)throw new Error('Stripe is not configured.');
  const qs=new URLSearchParams(params).toString();
  const r=await fetch(`https://api.stripe.com/v1/${path}${qs?`?${qs}`:''}`,{headers:{Authorization:`Bearer ${secret}`}});
  const data=await r.json();
  if(!r.ok)throw new Error(data?.error?.message||'Stripe request failed.');
  return data;
}
function serviceHeaders(){const key=process.env.SUPABASE_SERVICE_ROLE_KEY;return{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'}}
async function currentProfile(req){
  const url=process.env.VITE_SUPABASE_URL,anon=process.env.VITE_SUPABASE_ANON_KEY,authorization=req.headers.authorization;
  if(!url||!anon||!authorization)return null;
  const ur=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:authorization}});if(!ur.ok)return null;
  const user=await ur.json();
  const pr=await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,household_id,billing_owner`,{headers:{apikey:anon,Authorization:authorization}});
  const profiles=await pr.json();return{user,profile:profiles?.[0]||null};
}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  try{
    if(!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(500).json({error:'Billing database service is not configured.'});
    const auth=await currentProfile(req);if(!auth?.profile)return res.status(401).json({error:'Please sign in again.'});
    const sessionId=req.body?.session_id;if(!sessionId||!String(sessionId).startsWith('cs_'))return res.status(400).json({error:'Missing checkout session.'});
    const cs=await stripeGet(`checkout/sessions/${encodeURIComponent(sessionId)}`,{'expand[]':'subscription'});
    const meta=cs.metadata||{},p=auth.profile;
    if(!p.household_id||meta.household_id!==p.household_id||meta.billing_profile_id!==p.id)return res.status(403).json({error:'This checkout does not belong to your household.'});
    const s=cs.subscription;if(!s||typeof s==='string')return res.status(409).json({error:'Stripe has not attached the subscription yet. Please refresh in a moment.'});
    const sm=s.metadata||meta;
    const payload={profile_id:p.id,billing_profile_id:p.id,household_id:p.household_id,provider:'stripe',provider_customer_id:typeof s.customer==='string'?s.customer:s.customer?.id||cs.customer||null,provider_subscription_id:s.id,plan_key:sm.plan_key||meta.plan_key||null,status:s.status||'inactive',trial_ends_at:s.trial_end?new Date(s.trial_end*1000).toISOString():null,current_period_end:s.current_period_end?new Date(s.current_period_end*1000).toISOString():null,cancel_at_period_end:!!s.cancel_at_period_end,updated_at:new Date().toISOString()};
    const url=process.env.VITE_SUPABASE_URL;
    const up=await fetch(`${url}/rest/v1/subscriptions?on_conflict=provider_subscription_id`,{method:'POST',headers:{...serviceHeaders(),Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});
    if(!up.ok)throw new Error(`Could not save subscription (${up.status}): ${(await up.text()).slice(0,300)}`);
    const limit=String(payload.plan_key||'').startsWith('family_')?3:1;
    const hh=await fetch(`${url}/rest/v1/households?id=eq.${encodeURIComponent(p.household_id)}`,{method:'PATCH',headers:serviceHeaders(),body:JSON.stringify({plan_key:payload.plan_key,student_limit:limit})});
    if(!hh.ok)throw new Error(`Could not update household (${hh.status}).`);
    return res.status(200).json({ok:true,status:payload.status,plan_key:payload.plan_key,trial_ends_at:payload.trial_ends_at});
  }catch(e){console.error('confirm-checkout-session',e);return res.status(500).json({error:e.message||'Unable to confirm checkout.'});}
}
