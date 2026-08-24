import {json,service,enforceRateLimit} from '../server/supabase-server.js';
import {assertBillingPortalEnabled,billingContext,safeSiteOrigin,stripeRequest,stripeSecret} from '../server/stripe-server.js';

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertBillingPortalEnabled(req);stripeSecret();const auth=await billingContext(req),p=auth?.profile;if(!p)return json(res,401,{error:'Please sign in again.'});if(p.role!=='parent'||!p.household_id||!p.billing_owner)return json(res,403,{error:'Only the household billing owner can manage the subscription.'});
  await enforceRateLimit(auth.user.id,'billing/portal-create',{limit:20,windowSeconds:3600});
  const rows=await service(`/rest/v1/subscriptions?household_id=eq.${encodeURIComponent(p.household_id)}&select=provider_customer_id,status&order=created_at.desc&limit=1`),sub=rows?.[0];if(!sub?.provider_customer_id)return json(res,404,{error:'No billing customer is linked to this household yet.'});
  const portal=await stripeRequest('POST','billing_portal/sessions',{customer:sub.provider_customer_id,return_url:`${safeSiteOrigin()}/?app=1`});if(!portal?.url)return json(res,502,{error:'Billing provider did not return a portal link.'});return json(res,200,{url:portal.url});
 }catch(e){console.error('create-portal-session',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status<500?status:status===503?503:500,{error:status&&status<500?e.message:status===503?e.message:'Unable to open billing management right now.'})}
}
