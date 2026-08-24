import {json,service,enforceRateLimit} from '../server/supabase-server.js';
import {billingContext,safeSiteOrigin,stripeRequest,stripeSecret} from '../server/stripe-server.js';

const PLAN_PRICE_ENV={individual_monthly:'STRIPE_PRICE_INDIVIDUAL_MONTHLY',individual_annual:'STRIPE_PRICE_INDIVIDUAL_ANNUAL',family_monthly:'STRIPE_PRICE_FAMILY_MONTHLY',family_annual:'STRIPE_PRICE_FAMILY_ANNUAL'};

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  stripeSecret(); // Enforces sandbox by default. Live keys require explicit ALLOW_LIVE_BILLING=true.
  const auth=await billingContext(req),p=auth?.profile;if(!p)return json(res,401,{error:'Please sign in again.'});if(p.role!=='parent'||!p.household_id||!p.billing_owner)return json(res,403,{error:'A parent or guardian billing owner must activate the household plan.'});
  await enforceRateLimit(auth.user.id,'billing/checkout-create',{limit:10,windowSeconds:3600});
  const planKey=String(req.body?.plan_key||''),envName=PLAN_PRICE_ENV[planKey],price=envName&&process.env[envName];if(!envName||!price||!String(price).startsWith('price_'))return json(res,400,{error:'That plan is not configured for checkout yet.'});
  const students=await service(`/rest/v1/students?household_id=eq.${encodeURIComponent(p.household_id)}&select=id`),count=Array.isArray(students)?students.length:0;if(planKey.startsWith('individual_')&&count>1)return json(res,400,{error:'Your household has more than one student. Please select a Family plan.'});if(count>3)return json(res,400,{error:'The Family plan currently supports up to three students.'});
  const subs=await service(`/rest/v1/subscriptions?household_id=eq.${encodeURIComponent(p.household_id)}&select=provider_customer_id,provider_subscription_id,status,plan_key&order=created_at.desc&limit=1`),existing=subs?.[0];if(existing&&['trialing','active','past_due','unpaid'].includes(existing.status))return json(res,409,{error:'This household already has a subscription. Use Manage billing to change or manage the current plan.',has_subscription:true});
  const origin=safeSiteOrigin(),params={mode:'subscription','line_items[0][price]':price,'line_items[0][quantity]':'1',payment_method_collection:'always','subscription_data[trial_period_days]':'14','subscription_data[metadata][household_id]':p.household_id,'subscription_data[metadata][billing_profile_id]':p.id,'subscription_data[metadata][plan_key]':planKey,'metadata[household_id]':p.household_id,'metadata[billing_profile_id]':p.id,'metadata[plan_key]':planKey,client_reference_id:p.household_id,success_url:`${origin}/?app=1&billing=success&session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin}/?app=1&openBilling=1`,allow_promotion_codes:'true'};
  if(existing?.provider_customer_id)params.customer=existing.provider_customer_id;else params.customer_email=p.email||auth.user.email;
  const session=await stripeRequest('POST','checkout/sessions',params);if(!session?.url)return json(res,502,{error:'Billing provider did not return a checkout link.'});return json(res,200,{url:session.url});
 }catch(e){console.error('create-checkout-session',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status<500?status:status===503?503:500,{error:status&&status<500?e.message:status===503?e.message:'Unable to start checkout right now.'})}
}
