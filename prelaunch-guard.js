const PUBLIC_BILLING_ENABLED = false;
const PUBLIC_HOSTS = new Set(['satprep.io','www.satprep.io']);
const IS_PUBLIC_HOST = PUBLIC_HOSTS.has(location.hostname.toLowerCase());
const BILLING_UI_ALLOWED = PUBLIC_BILLING_ENABLED || !IS_PUBLIC_HOST;
window.__SATPREP_PRELAUNCH__ = !PUBLIC_BILLING_ENABLED;

if(!BILLING_UI_ALLOWED){
  const params = new URLSearchParams(location.search);
  let changed = false;
  for(const key of ['openBilling','billing','session_id']){
    if(params.has(key)){ params.delete(key); changed = true; }
  }
  if(changed){
    const qs = params.toString();
    history.replaceState({},'',`${location.pathname}${qs?`?${qs}`:''}${location.hash}`);
  }
}

function ageFromDob(value){
  if(!value) return null;
  const dob = new Date(`${value}T12:00:00`);
  if(Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const month = now.getMonth() - dob.getMonth();
  if(month < 0 || (month === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// Defense in depth: the marketing flow performs this validation natively before
// account creation. Keep a capture-phase guard so a future UI regression cannot
// accidentally create an under-13 account through the teen path.
function guardYouthSignup(event){
  const form = event.target;
  if(!(form instanceof HTMLFormElement) || form.id !== 'teenForm') return;
  const dob = form.querySelector('#sDob')?.value;
  const age = ageFromDob(dob);
  if(age == null || age < 13 || age > 20){
    event.preventDefault();
    event.stopImmediatePropagation();
    const msg = form.parentElement?.querySelector('#msg') || document.querySelector('#msg');
    if(msg) msg.innerHTML = age != null && age < 13
      ? '<div class="notice"><strong>A parent or guardian needs to complete setup.</strong><br>Use Back and choose your actual age so SATprep.io can use the appropriate account flow.</div>'
      : '<div class="error">Enter a valid date of birth before creating the account.</div>';
  }
}

document.addEventListener('submit', guardYouthSignup, true);

document.addEventListener('click', event=>{
  if(BILLING_UI_ALLOWED) return;
  const target = event.target.closest?.('#billingBtn,.billing-checkout,#manageSubscription');
  if(!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  alert('Plans and billing are still in pre-launch validation. No public purchase or trial is available yet.');
}, true);

function applyPrelaunchCommercialState(){
  if(PUBLIC_BILLING_ENABLED) return;
  const pricing = document.querySelector('#pricing');
  if(pricing && pricing.dataset.prelaunchGuarded !== '1'){
    pricing.dataset.prelaunchGuarded = '1';
    pricing.innerHTML = `<div class="section-heading"><span>PLANS</span><h2>Public plans are being finalized.</h2><p>SATprep.io is still completing commercial, billing, privacy, and content-quality validation. Public pricing and trial terms will be posted only after those launch checks are complete.</p></div>`;
  }
  document.querySelectorAll('.marketing-links a[href="#pricing"]').forEach(a=>a.textContent='Plans');
  const trust = document.querySelector('.trust-row');
  if(trust && trust.dataset.prelaunchGuarded !== '1'){
    trust.dataset.prelaunchGuarded = '1';
    trust.innerHTML = '<span>✓ Personalized learning path</span><span>✓ Parent progress visibility</span><span>✓ Assessment-informed practice</span>';
  }
  document.querySelectorAll('.final-cta .small').forEach(el=>{
    if(/trial|cancel/i.test(el.textContent || '')) el.remove();
  });
  if(!BILLING_UI_ALLOWED){
    document.querySelectorAll('#billingBtn,.billing-checkout,#manageSubscription').forEach(el=>el.remove());
    const billingHeading = [...document.querySelectorAll('h1')].find(h=>/plans\s*&\s*billing/i.test(h.textContent||''));
    if(billingHeading){
      const main = billingHeading.closest('main');
      if(main) main.innerHTML = `<section class="hero"><h1>Plans & Billing</h1><p>Billing is still in pre-launch validation. No public purchase, paid plan, or trial is available yet.</p></section><section class="card"><button class="btn" id="prelaunchBillingBack">Return to dashboard</button></section>`;
      document.querySelector('#prelaunchBillingBack')?.addEventListener('click',()=>location.assign('/?app=1'));
    }
  }
}

let scheduled = false;
function scheduleGuard(){
  if(scheduled) return;
  scheduled = true;
  queueMicrotask(()=>{
    scheduled = false;
    applyPrelaunchCommercialState();
  });
}

new MutationObserver(scheduleGuard).observe(document.documentElement,{subtree:true,childList:true});
scheduleGuard();
