import { confirmationCopy, escapeAuthHtml, requestAuthEmail } from './auth-flow.js';
import { supabase } from './supabase.js';

export function showEmailConfirmation(email = '', role = '') {
  const copy = confirmationCopy(role);
  document.querySelector('#app').innerHTML=`
    <div class="top"><div class="logo">SAT<span>prep.io</span></div><div class="navlinks"><button class="linkbtn" id="confirmHome">Home</button></div></div>
    <main class="wrap"><div class="auth"><div class="card" style="text-align:center;padding:40px 28px">
      <div class="eyebrow">CHECK YOUR EMAIL</div>
      <h1 tabindex="-1" id="confirmationHeading">Please confirm your email address</h1>
      <p class="muted">To finish setting up your ${copy.account}, open the confirmation link${email ? ` sent to <strong>${escapeAuthHtml(email)}</strong>` : ' in your email'} and ${copy.next}.</p>
      <div class="notice" style="text-align:left;margin-bottom:22px"><strong>Next step:</strong> Check your inbox for the SATprep.io verification email. If you don't see it within a few minutes, check your spam or junk folder. If you already have an account, you can log in.</div>
      <div id="confirmationStatus" role="status" aria-live="polite"></div>
      <button class="btn" id="confirmLogin">I've confirmed my email — Log in</button>
      ${email ? '<p><button class="linkbtn" id="confirmResend">Resend confirmation email</button></p>' : ''}
    </div></div></main>`;
  document.querySelector('#confirmHome').onclick=()=>location.assign('/');
  document.querySelector('#confirmLogin').onclick=()=>location.assign('/?auth=login');
  const resend = document.querySelector('#confirmResend');
  if (resend) resend.onclick = async () => {
    if (resend.disabled) return;
    resend.disabled = true;
    const status = document.querySelector('#confirmationStatus');
    try { status.textContent = await requestAuthEmail(supabase?.auth, 'confirmation', email, location.origin); }
    catch (error) { status.textContent = error.message; }
    finally { setTimeout(() => { if (resend.isConnected) resend.disabled = false; }, 60000); }
  };
  document.querySelector('#confirmationHeading').focus();
}
// Signup calls this with its explicit role; no observer reclassifies learner accounts.
