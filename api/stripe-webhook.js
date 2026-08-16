import crypto from "node:crypto";

export const config={api:{bodyParser:false}};

async function rawBody(req){const chunks=[];for await(const c of req)chunks.push(Buffer.isBuffer(c)?c:Buffer.from(c));return Buffer.concat(chunks).toString("utf8");}
function safeEqual(a,b){try{const aa=Buffer.from(a,"hex"),bb=Buffer.from(b,"hex");return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}catch{return false;}}
function verify(raw,header,secret){
  if(!header||!secret)return false;
  const parts=header.split(",").map(x=>x.split("="));
  const t=parts.find(x=>x[0]==="t")?.[1];
  const sigs=parts.filter(x=>x[0]==="v1").map(x=>x[1]);
  if(!t||!sigs.length||Math.abs(Date.now()/1000-Number(t))>300)return false;
  const expected=crypto.createHmac("sha256",secret).update(`${t}.${raw}`,"utf8").digest("hex");
  return sigs.some(s=>safeEqual(expected,s));
}

function sbHeaders(){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"};
}
async function recordEvent(event){
  const url=process.env.VITE_SUPABASE_URL;
  const r=await fetch(`${url}/rest/v1/stripe_events`,{method:"POST",headers:sbHeaders(),body:JSON.stringify({event_id:event.id,event_type:event.type})});
  if(r.status===409)return false;
  if(!r.ok)throw new Error(`Could not record Stripe event (${r.status}).`);
  return true;
}
async function syncSubscription(s){
  const url=process.env.VITE_SUPABASE_URL;
  const meta=s.metadata||{};
  if(!meta.billing_profile_id||!meta.household_id)return;
  const payload={
    profile_id:meta.billing_profile_id,
    billing_profile_id:meta.billing_profile_id,
    household_id:meta.household_id,
    provider:"stripe",
    provider_customer_id:typeof s.customer==="string"?s.customer:s.customer?.id||null,
    provider_subscription_id:s.id,
    plan_key:meta.plan_key||null,
    status:s.status||"inactive",
    trial_ends_at:s.trial_end?new Date(s.trial_end*1000).toISOString():null,
    current_period_end:s.current_period_end?new Date(s.current_period_end*1000).toISOString():null,
    cancel_at_period_end:!!s.cancel_at_period_end,
    updated_at:new Date().toISOString()
  };
  const r=await fetch(`${url}/rest/v1/subscriptions?on_conflict=provider_subscription_id`,{method:"POST",headers:{...sbHeaders(),Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(payload)});
  if(!r.ok)throw new Error(`Could not synchronize subscription (${r.status}).`);
  const limit=String(meta.plan_key||"").startsWith("family_")?3:1;
  await fetch(`${url}/rest/v1/households?id=eq.${encodeURIComponent(meta.household_id)}`,{method:"PATCH",headers:sbHeaders(),body:JSON.stringify({plan_key:meta.plan_key||null,student_limit:limit})});
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).send("Method not allowed");
  try{
    const raw=await rawBody(req);
    if(!verify(raw,req.headers["stripe-signature"],process.env.STRIPE_WEBHOOK_SECRET))return res.status(400).send("Invalid Stripe signature");
    const event=JSON.parse(raw);
    if(!(await recordEvent(event)))return res.status(200).json({received:true,duplicate:true});
    if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type))await syncSubscription(event.data.object);
    return res.status(200).json({received:true});
  }catch(e){console.error("stripe-webhook",e);return res.status(500).send("Webhook processing failed");}
}
