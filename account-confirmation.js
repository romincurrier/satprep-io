const app=document.querySelector('#app');

function showEmailConfirmation(email=''){
  app.innerHTML=`
    <div class="top"><div class="logo">SAT<span>prep.io</span></div><div class="navlinks"><button class="linkbtn" id="confirmHome">Home</button></div></div>
    <main class="wrap"><div class="auth"><div class="card" style="text-align:center;padding:40px 28px">
      <div style="font-size:46px;line-height:1;margin-bottom:18px">✓</div>
      <div class="eyebrow">ACCOUNT CREATED</div>
      <h1 style="margin:0 0 14px">Please confirm your email address</h1>
      <p class="muted" style="font-size:17px;line-height:1.6;max-width:520px;margin:0 auto 22px">Your parent account was created successfully. We sent a confirmation link${email?` to <strong>${email}</strong>`:''}. Open that email and click the confirmation link to continue setting up your family.</p>
      <div class="notice" style="text-align:left;max-width:520px;margin:0 auto 22px"><strong>Next step:</strong> Check your inbox for the SATprep.io verification email. If you don't see it within a few minutes, check your spam or junk folder.</div>
      <button class="btn" id="confirmLogin">I've confirmed my email — Log in</button>
    </div></div></main>`;
  document.querySelector('#confirmHome').onclick=()=>location.assign('/');
  document.querySelector('#confirmLogin').onclick=()=>location.assign('/');
}

function detectConfirmation(){
  const success=[...document.querySelectorAll('.success')].find(el=>/check your email to confirm your account/i.test(el.textContent||''));
  if(!success) return;
  const email=document.querySelector('#pEmail')?.value?.trim()||document.querySelector('#sEmail')?.value?.trim()||'';
  showEmailConfirmation(email);
}

const observer=new MutationObserver(()=>detectConfirmation());
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(detectConfirmation,0);
