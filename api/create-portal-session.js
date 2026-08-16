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
  const url=process.env.VITE_SUPABASE_URL,anon=process.env.VITE_SUPABASE_ANON_KEY,authorization=req.headers.authorization;
  if(!url||!anon||!authorization)return null;
  const u=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:authorization}});
  if(!u.ok)return null;
  const user=await u.json();
  const p=await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,household_id,billing_owner`,{headers:{apikey:anon,Authorization:authorization}});
  return {user,profile:(await p.json())?.[0]||null,url,anon,authorization};
}

export default async function handler(req,res){
  if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
  try{
    const auth=await currentUser(req),p=auth?.profile;
    if(!p)return json(res,401,{error:"Please sign in again."});
    if(p.role!=="parent"||!p.household_id||!p.billing_owner)return json(res,403,{error:"Only the household billing owner can manage the subscription."});
    const r=await fetch(`${auth.url}/rest/v1/subscriptions?household_id=eq.${p.household_id}&select=provider_customer_id,status&order=created_at.desc&limit=1`,{headers:{apikey:auth.anon,Authorization:auth.authorization}});
    const sub=(await r.json())?.[0];
    if(!sub?.provider_customer_id)return json(res,404,{error:"No Stripe customer is linked to this household yet."});
    const origin=(process.env.SITE_URL||"https://satprep.io").replace(/\/$/,"");
    const portal=await stripePost("billing_portal/sessions",{customer:sub.provider_customer_id,return_url:`${origin}/?app=1`});
    return json(res,200,{url:portal.url});
  }catch(e){return json(res,500,{error:e.message||"Unable to open billing portal."});}
}
