import {enforceRateLimit,json,service} from '../server/supabase-server.js';
import {assertBillingRequestOrigin,billingContext} from '../server/stripe-server.js';

function finiteDate(value){
 if(!value)return null;
 const d=new Date(value);
 return Number.isFinite(d.getTime())?d.toISOString():null;
}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertBillingRequestOrigin(req);
  const auth=await billingContext(req),p=auth?.profile;
  if(!p)return json(res,401,{error:'Please sign in again.'});
  await enforceRateLimit(auth.user.id,'billing/overview',{limit:60,windowSeconds:60});

  if(p.role==='admin')return json(res,200,{ok:true,profile:{role:'admin',billing_owner:false},student_count:0,subscription:null});
  if(p.role!=='parent')return json(res,200,{ok:true,profile:{role:String(p.role||'student'),billing_owner:false},student_count:0,subscription:null});

  let studentCount=0,sub=null;
  if(p.household_id){
   const [students,subs]=await Promise.all([
    service(`/rest/v1/students?household_id=eq.${encodeURIComponent(p.household_id)}&select=id`),
    service(`/rest/v1/subscriptions?household_id=eq.${encodeURIComponent(p.household_id)}&select=plan_key,status,trial_ends_at,current_period_end,cancel_at_period_end,provider_customer_id&order=created_at.desc&limit=1`)
   ]);
   studentCount=Array.isArray(students)?students.length:0;
   sub=subs?.[0]||null;
  }

  const subscription=sub?{
   plan_key:sub.plan_key||null,
   status:sub.status||null,
   trial_ends_at:finiteDate(sub.trial_ends_at),
   current_period_end:finiteDate(sub.current_period_end),
   cancel_at_period_end:!!sub.cancel_at_period_end,
   can_manage:!!sub.provider_customer_id
  }:null;
  return json(res,200,{ok:true,profile:{role:'parent',billing_owner:!!p.billing_owner},student_count:studentCount,subscription});
 }catch(e){
  console.error('billing-overview',e?.message||e);
  if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));
  const status=Number(e.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?e.message:status===503?e.message:'Unable to load billing details right now.'});
 }
}
