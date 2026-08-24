import {json,service,enforceRateLimit} from '../server/supabase-server.js';
import {assertCheckoutSurfaceEnabled,billingContext,stripeRequest,stripeSecret} from '../server/stripe-server.js';

const PLANS=new Set(['individual_monthly','individual_annual','family_monthly','family_annual']);
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertCheckoutSurfaceEnabled(req);stripeSecret();const auth=await billingContext(req),p=auth?.profile;if(!p)return json(res,401,{error:'Please sign in again.'});if(p.role!=='parent'||!p.household_id||!p.billing_owner)return json(res,403,{error:'Only the household billing owner can confirm checkout.'});
  await enforceRateLimit(auth.user.id,'billing/checkout-confirm',{limit:30,windowSeconds:3600});
  const sessionId=String(req.body?.session_id||'').trim();if(!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)||sessionId.length>200)return json(res,400,{error:'Missing or invalid checkout session.'});
  const cs=await stripeRequest('GET',`checkout/sessions/${encodeURIComponent(sessionId)}`,{'expand[]':'subscription'}),meta=cs.metadata||{};if(meta.household_id!==p.household_id||meta.billing_profile_id!==p.id||cs.client_reference_id!==p.household_id)return json(res,403,{error:'This checkout does not belong to your household.'});
  const s=cs.subscription;if(!s||typeof s==='string')return json(res,409,{error:'The subscription is still being prepared. Please retry shortly.'});const sm=s.metadata||meta,planKey=String(sm.plan_key||meta.plan_key||'');if(!PLANS.has(planKey)||String(sm.household_id||meta.household_id)!==p.household_id||String(sm.billing_profile_id||meta.billing_profile_id)!==p.id)return json(res,409,{error:'Checkout metadata could not be verified.'});
  const payload={profile_id:p.id,billing_profile_id:p.id,household_id:p.household_id,provider:'stripe',provider_customer_id:typeof s.customer==='string'?s.customer:s.customer?.id||cs.customer||null,provider_subscription_id:s.id,plan_key:planKey,status:s.status||'inactive',trial_ends_at:s.trial_end?new Date(s.trial_end*1000).toISOString():null,current_period_end:s.current_period_end?new Date(s.current_period_end*1000).toISOString():null,cancel_at_period_end:!!s.cancel_at_period_end,updated_at:new Date().toISOString()};
  await service('/rest/v1/subscriptions?on_conflict=provider_subscription_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(payload)});const limit=planKey.startsWith('family_')?3:1;await service(`/rest/v1/households?id=eq.${encodeURIComponent(p.household_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({plan_key:planKey,student_limit:limit})});
  return json(res,200,{ok:true,status:payload.status,plan_key:planKey,trial_ends_at:payload.trial_ends_at});
 }catch(e){console.error('confirm-checkout-session',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status<500?status:status===503?503:500,{error:status&&status<500?e.message:status===503?e.message:'Unable to confirm checkout right now.'})}
}
