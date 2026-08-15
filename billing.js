import { supabase } from "./supabase.js";

const TEST_LINKS = {
  individual_monthly: "https://buy.stripe.com/test_eVq5kD1Hp8oC6SBczMg7e00",
  individual_annual: "https://buy.stripe.com/test_7sYfZhcm3gV87WF1V8g7e01",
  family_monthly: "https://buy.stripe.com/test_8x29AT5XF0Wa1yhdDQg7e02",
  family_annual: "https://buy.stripe.com/test_cNifZhgCjdIW4Kt9nAg7e03"
};

const PLANS = [
  { key:"individual_monthly", name:"Individual Monthly", price:"$19.95", cadence:"per month", students:"1 student" },
  { key:"individual_annual", name:"Individual Annual", price:"$199", cadence:"per year", students:"1 student", value:"Save $40.40/year" },
  { key:"family_monthly", name:"Family Monthly", price:"$29.95", cadence:"per month", students:"Up to 3 students" },
  { key:"family_annual", name:"Family Annual", price:"$299", cadence:"per year", students:"Up to 3 students", value:"Save $60.40/year" }
];

let session=null,profile=null,subscription=null;
const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));

async function refreshBillingState(){
  const {data:{session:s}}=await supabase.auth.getSession();session=s;profile=null;subscription=null;if(!session)return;
  const uid=session.user.id;
  const {data:p}=await supabase.from("profiles").select("id,email,first_name,last_name,role,household_id").eq("id",uid).maybeSingle();profile=p;
  const {data:sub}=await supabase.from("subscriptions").select("*").or(`profile_id.eq.${uid}${p?.household_id?`,household_id.eq.${p.household_id}`:""}`).limit(1).maybeSingle();subscription=sub;
}
function checkoutUrl(planKey){const base=TEST_LINKS[planKey],email=session?.user?.email;if(!email)return base;const u=new URL(base);u.searchParams.set("prefilled_email",email);return u.toString()}
function statusText(){if(profile?.role==="admin")return"Administrator access";if(!subscription)return"No paid plan on file";const label=subscription.status||"unknown";return subscription.plan_key?`${label} · ${subscription.plan_key.replaceAll("_"," ")}`:label}
function planCard(p){return `<div class="card" style="min-width:240px;flex:1"><div class="label">${esc(p.students)}</div><h2 style="margin:8px 0 2px">${esc(p.name)}</h2><div class="metric" style="font-size:32px">${esc(p.price)}</div><div class="small">${esc(p.cadence)}</div>${p.value?`<div class="success" style="margin-top:12px">${esc(p.value)}</div>`:""}<p class="small">14-day free trial. Payment method collected securely by Stripe. Cancel before the trial ends to avoid being charged.</p><button class="btn billing-checkout" data-plan="${esc(p.key)}" style="width:100%">Start 14-day trial</button></div>`}

async function renderBilling(){
  await refreshBillingState();const app=document.querySelector("#app");if(!app)return;
  app.innerHTML=`<div class="top"><div class="logo">SAT<span>prep.io</span></div><div class="navlinks"><button class="linkbtn" id="billingBack">Dashboard</button></div></div><main class="wrap"><section class="hero"><h1>Plans & Billing</h1><p>Choose the plan that fits your family. Every paid plan begins with a 14-day free trial.</p></section><section class="grid"><div class="card c12"><div class="row"><div><h2>Account</h2><div class="small">${esc(session?.user?.email||"")}</div></div><span class="badge ${profile?.role==="admin"||["active","trialing"].includes(subscription?.status)?"good":"warn"}">${esc(statusText())}</span></div></div><div class="card c12"><div style="display:flex;gap:16px;flex-wrap:wrap">${PLANS.map(planCard).join("")}</div></div><div class="card c12"><div class="notice"><strong>Test billing is active.</strong> Stripe is currently in test mode, so no real card will be charged. Subscription access will only be activated from a verified Stripe event once the webhook layer is connected.</div></div></section></main>`;
  document.querySelector("#billingBack")?.addEventListener("click",()=>location.assign("/?app=1"));
  document.querySelectorAll(".billing-checkout").forEach(btn=>btn.addEventListener("click",()=>location.href=checkoutUrl(btn.dataset.plan)));
}
function injectBillingButton(){const nav=document.querySelector(".navlinks");if(!nav||document.querySelector("#billingBtn")||!session)return;const b=document.createElement("button");b.className="linkbtn";b.id="billingBtn";b.textContent="Plans & Billing";b.addEventListener("click",renderBilling);nav.prepend(b)}
async function init(){
  await refreshBillingState();const params=new URLSearchParams(location.search);
  if(params.get("billing")==="success"){history.replaceState({},"",location.pathname+"?app=1");setTimeout(async()=>{await refreshBillingState();alert("Stripe checkout completed in test mode. We are verifying the subscription before activating paid access.");},400)}
  if(params.get("openBilling")==="1"&&session){await renderBilling();return;}
  injectBillingButton();const observer=new MutationObserver(()=>injectBillingButton());observer.observe(document.documentElement,{subtree:true,childList:true});
  supabase.auth.onAuthStateChange(async(_event,s)=>{session=s;await refreshBillingState();setTimeout(injectBillingButton,0)});
}
init();
