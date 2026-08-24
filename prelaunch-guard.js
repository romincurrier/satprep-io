const PUBLIC_BILLING_ENABLED = false;
const PUBLIC_HOSTS = new Set(['satprep.io','www.satprep.io']);
const IS_PUBLIC_HOST = PUBLIC_HOSTS.has(location.hostname.toLowerCase());
const BILLING_UI_ALLOWED = PUBLIC_BILLING_ENABLED || !IS_PUBLIC_HOST;

const esc = value => String(value ?? '').replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));

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

async function submitParentSetup(form){
  const input = form.querySelector('#guardianEmail');
  const msg = form.parentElement?.querySelector('#msg') || document.querySelector('#msg');
  const email = String(input?.value || '').trim();
  if(!email){
    if(msg) msg.innerHTML = '<div class="error">Enter a parent or guardian email.</div>';
    return;
  }
  const button = form.querySelector('button[type="submit"],button.btn');
  if(button) button.disabled = true;
  try{
    const response = await fetch('/api/parent-setup-request',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({parent_email:email})
    });
    const body = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(body.error || 'Unable to save the setup request right now.');
    if(msg) msg.innerHTML = '<div class="success"><strong>You’re all set for now.</strong><br>Your parent or guardian can complete the family setup.</div>';
    form.reset();
  }catch(error){
    if(msg) msg.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }finally{
    if(button) button.disabled = false;
  }
}

function guardYouthSignup(event){
  const form = event.target;
  if(!(form instanceof HTMLFormElement)) return;

  if(form.id === 'guardianForm'){
    event.preventDefault();
    event.stopImmediatePropagation();
    submitParentSetup(form);
    return;
  }

  if(form.id === 'teenForm'){
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
