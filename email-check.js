import { supabase } from "./supabase.js";

const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));

function signupEmailField(form){
  if(form.id==="parentForm") return form.querySelector("#pEmail");
  if(form.id==="teenForm") return form.querySelector("#sEmail");
  return null;
}

function messageBox(form){
  return form.closest(".card")?.querySelector("#msg") || form.closest(".card")?.querySelector("#authMessage");
}

document.addEventListener("input",e=>{
  if(e.target?.id!=="pEmail" && e.target?.id!=="sEmail") return;
  const form=e.target.closest("form");
  if(form) delete form.dataset.checkedEmail;
},true);

document.addEventListener("submit",async e=>{
  const form=e.target;
  const input=signupEmailField(form);
  if(!input) return;
  const email=input.value.trim().toLowerCase();
  if(!email) return;
  if(form.dataset.checkedEmail===email) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  const btn=form.querySelector('button[type="submit"],button:not([type])');
  const original=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent="Checking email…";}
  const box=messageBox(form);
  if(box) box.innerHTML="";

  const {data,error}=await supabase.rpc("email_registered",{input_email:email});
  if(btn){btn.disabled=false;btn.textContent=original||"Continue";}

  if(error){
    if(box) box.innerHTML=`<div class="error">We couldn't verify that email right now. Please try again.</div>`;
    return;
  }
  if(data===true){
    if(box) box.innerHTML=`<div class="error"><strong>An account already exists with ${esc(email)}.</strong><br>Please log in instead, or use a different email address.</div>`;
    input.focus();
    return;
  }

  form.dataset.checkedEmail=email;
  form.requestSubmit();
},true);
