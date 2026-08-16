const PLAN_PRICE_ENV={
  individual_monthly:"STRIPE_PRICE_INDIVIDUAL_MONTHLY",
  individual_annual:"STRIPE_PRICE_INDIVIDUAL_ANNUAL",
  family_monthly:"STRIPE_PRICE_FAMILY_MONTHLY",
  family_annual:"STRIPE_PRICE_FAMILY_ANNUAL"
};

function json(res,status,body){res.status(status).setHeader("Content-Type","application/json").send(JSON.stringify(body));}

async function stripePost(path,params){
  const secret=process.env.STRIPE_SECRET_KEY;
  if(!secret) throw new Error("Stripe is not configured for this environment.");
  const r=await fetch(`https://api.stripe.com/v1/${path}`,{method:"POST",headers:{Authorization:`Bearer ${secret}`,"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(params)});
  const data=await r.json();
  if(!r.ok) throw new Error(data?.error?.message||"Stripe request failed.");
  return data;
}

async function currentUser(req){
  const url=process.env.VITE_SUPABASE_URL,anon=process.env.VITE_SUPABASE_ANON_KEY;
  const authorization=req.headers.authorization;
  if(!url||!anon||!authorization) return null;
  const u=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:authorization}});
  if(!u.ok) return null;
  const user=await u.json();
  const p=await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,email,first_name,last_name,role,household_id,billing_owner`,{headers:{apikey:anon,Authorization:authorization}});
  const profiles=await p.json();
  return {user,profile:profiles?.[0]||null,url,anon,authorization};
}

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  try{
    const auth=await currentUser(req);
    if(!auth?.profile) return json(res,401,{error:"Please sign in again."});
    const p=auth.profile;
    if(p.role!=="parent"||!p.household_id||!p.billing_owner) return json(res,403,{error:"A parent or guardian billing owner must activate the household plan."});

    const planKey=req.body?.plan_key;
    const envName=PLAN_PRICE_ENV[planKey];
    const price=envName&&process.env[envName];
    if(!price) return json(res,400,{error:"That plan is not configured for checkout yet."});

    const countReq=await fetch(`${auth.url}/rest/v1/students?household_id=eq.${p.household_id}&select=id`,{headers:{apikey:auth.anon,Authorization:auth.authorization,Prefer:"count=exact"}});
    const students=await countReq.json();
    const count=Array.isArray(students)?students.length:0;
    if(planKey.startsWith("individual_")&&count>1) return json(res,400,{error:"Your household has more than one student. Please select a Family plan."});
    if(count>3) return json(res,400,{error:"The Family plan currently supports up to three students."});

    const subReq=await fetch(`${auth.url}/rest/v1/subscriptions?household_id=eq.${p.household_id}&select=provider_customer_id,status&order=created_at.desc&limit=1`,{headers:{apikey:auth.anon,Authorization:auth.authorization}});
    const existing=(await subReq.json())?.[0];

    const origin=(process.env.SITE_URL||"https://satprep.io").replace(/\/$/,"");
    const params={
      mode:"subscription",
      "line_items[0][price]":price,
      "line_items[0][quantity]":"1",
      payment_method_collection:"always",
      "subscription_data[trial_period_days]":"14",
      "subscription_data[metadata][household_id]":p.household_id,
      "subscription_data[metadata][billing_profile_id]":p.id,
      "subscription_data[metadata][plan_key]":planKey,
      "metadata[household_id]":p.household_id,
      "metadata[billing_profile_id]":p.id,
      "metadata[plan_key]":planKey,
      client_reference_id:p.household_id,
      success_url:`${origin}/?app=1&billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${origin}/?app=1&openBilling=1`,
      allow_promotion_codes:"true"
    };
    if(existing?.provider_customer_id) params.customer=existing.provider_customer_id;
    else params.customer_email=p.email||auth.user.email;

    const session=await stripePost("checkout/sessions",params);
    return json(res,200,{url:session.url});
  }catch(e){return json(res,500,{error:e.message||"Unable to start checkout."});}
}
