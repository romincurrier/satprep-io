import { supabase } from "./supabase.js";

const PLANS=[
  {key:"individual_monthly",name:"Individual Monthly",price:"$19.95",cadence:"per month",students:"1 student"},
  {key:"individual_annual",name:"Individual Annual",price:"$199",cadence:"per year",students:"1 student",value:"Save $40.40/year"},
  {key:"family_monthly",name:"Family Monthly",price:"$29.95",cadence:"per month",students:"Up to 3 students"},
  {key:"family_annual",name:"Family Annual",price:"$299",cadence:"per year",students:"Up to 3 students",value:"Save $60.40/year"}
];

let session=null,profile=null,subscription=null,studentCount=0;
const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));

async function refreshBillingState(){
  const {data:{session:s}}=await supabase.auth.getSession();session=s;profile=null;subscription=null;studentCount=0;if(!session)return;
  const uid=session.user.id;
  const {data:p}=await supabase.from("profiles").select("id,email,first_name,last_name,role,household_id,billing_owner").eq("id",uid).maybeSingle();profile=p;
  if(p?.household_id){
    const [{data:subs},{data:students}]=await Promise.all([
      supabase.from("subscriptions").select("*").eq("household_id",p.household_id).order("created_at",{ascending:false}).limit(1),
      supabase.from("students").select("id").eq("household_id",p.household_id)
    ]);
    subscription=subs?.[0]||null;studentCount=students?.length||0;
  }else{
    const {data:sub}=await supabase.from("subscriptions").select("*").eq("profile_id",uid).order("created_at",{ascending:false}).limit(1);subscription=sub?.[0]||null;
  }
}
function statusText(){if(profile?.role==="admin")return"Administrator access";if(!subscription)return"No paid plan on file";const label=subscription.status||"unknown";return subscription.plan_key?`${label} · ${subscription.plan_key.replaceAll("_"," ")}`:label}
function planCard(p){const blocked=p.key.startsWith("individual_")&&studentCount>1;return `<div class="card" style="min-width:240px;flex:1"><div class="label">${esc(p.students)}</div><h2 style="margin:8px 0 2px">${esc(p.name)}</h2><div class="metric" style="font-size:32px">${esc(p.price)}</div><div class="small">${esc(p.cadence)}</div>${p.value?`<div class="success" style="margin-top:12px">${esc(p.value)}</div>`:""}<p class="small">14-day free trial. Payment method collected securely by Stripe. Cancel before the trial ends to avoid being charged.</p>${blocked?`<div class="notice">Your household has ${studentCount} students, so choose a Family plan.</div>`:`<button class="btn billing-checkout" data-plan="${esc(p.key)}" style="width:100%">Start 14-day trial</button>`}</div>`}

async function authedPost(url,body={}){
  const {data:{session:s}}=await supabase.auth.getSession();
  if(!s)throw new Error("Please sign in again.");
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${s.access_token}`},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||"Billing request failed.");
  return data;
}

async function startCheckout(planKey,btn){
  const old=btn.textContent;btn.disabled=true;btn.textContent="Opening secure checkout…";
  try{const data=await authedPost("/api/create-checkout-session",{plan_key:planKey});location.href=data.url;}
  catch(e){alert(e.message);btn.disabled=false;btn.textContent=old;}
}
async function openPortal(btn){
  const old=btn.textContent;btn.disabled=true;btn.textContent="Opening billing portal…";
  try{const data=await authedPost("/api/create-portal-session");location.href=data.url;}
  catch(e){alert(e.message);btn.disabled=false;btn.textContent=old;}
}

async function renderBilling(){
  await refreshBillingState();const app=document.querySelector("#app");if(!app||!session)return;
  const active=["trialing","active","past_due"].includes(subscription?.status);
  app.innerHTML=`<div id="parentFamilySetup" style="display:none"></div><div class="top"><div class="logo">SAT<span>prep.io</span></div><div class="navlinks"><button class="linkbtn" id="billingBack">Dashboard</button></div></div><main class="wrap"><section class="hero"><h1>Plans & Billing</h1><p>${active?"Manage your household subscription and payment method.":"Choose the plan that fits your family. Every paid plan begins with a 14-day free trial."}</p></section><section class="grid"><div class="card c12"><div class="row"><div><h2>Account</h2><div class="small">${esc(session?.user?.email||"")} · ${studentCount} student${studentCount===1?"":"s"}</div></div><span class="badge ${profile?.role==="admin"||["active","trialing"].includes(subscription?.status)?"good":"warn"}">${esc(statusText())}</span></div>${subscription?.trial_ends_at?`<p class="small">Trial ends ${new Date(subscription.trial_ends_at).toLocaleDateString()}.</p>`:""}${active&&subscription?.provider_customer_id?`<button class="btn secondary" id="manageSubscription">Manage subscription & payment method</button>`:""}</div>${active?``:`<div class="card c12"><div style="display:flex;gap:16px;flex-wrap:wrap">${PLANS.map(planCard).join("")}</div></div>`}<div class="card c12"><div class="notice"><strong>Secure Stripe billing.</strong> SATprep.io never stores card numbers. Stripe handles payment collection, card updates, authentication, and subscription billing.</div></div></section></main>`;
  document.querySelector("#billingBack")?.addEventListener("click",()=>location.assign("/?app=1"));
  document.querySelectorAll(".billing-checkout").forEach(btn=>btn.addEventListener("click",()=>startCheckout(btn.dataset.plan,btn)));
  document.querySelector("#manageSubscription")?.addEventListener("click",e=>openPortal(e.currentTarget));
}
function injectBillingButton(){const nav=document.querySelector(".navlinks");if(!nav||document.querySelector("#billingBtn")||!session)return;const b=document.createElement("button");b.className="linkbtn";b.id="billingBtn";b.textContent="Plans & Billing";b.addEventListener("click",renderBilling);nav.prepend(b)}
async function init(){
  await refreshBillingState();const params=new URLSearchParams(location.search);
  if(params.get("billing")==="success"){
    history.replaceState({},"",location.pathname+"?app=1");
    setTimeout(async()=>{await refreshBillingState();alert(["trialing","active"].includes(subscription?.status)?"Your SATprep.io subscription is active.":"Checkout completed. Stripe is confirming your subscription now; your access will update automatically.");},700);
  }
  if(params.get("openBilling")==="1"&&session){await renderBilling();const observer=new MutationObserver(()=>{if(!document.querySelector(".billing-checkout")&&!document.querySelector("#manageSubscription"))setTimeout(renderBilling,0)});observer.observe(document.documentElement,{subtree:true,childList:true});return;}
  injectBillingButton();const observer=new MutationObserver(()=>injectBillingButton());observer.observe(document.documentElement,{subtree:true,childList:true});
  supabase.auth.onAuthStateChange(async(_event,s)=>{session=s;await refreshBillingState();setTimeout(injectBillingButton,0)});
}
init();
