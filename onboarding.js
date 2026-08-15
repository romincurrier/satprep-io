import { supabase } from "./supabase.js";

const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));
let replacing=false;

function signupWizard(){
  const form=document.querySelector("#authForm");
  const role=document.querySelector("#role");
  if(!form||!role||form.dataset.householdWizard==="1"||replacing) return;
  replacing=true;
  form.dataset.householdWizard="1";
  form.innerHTML=`
    <div class="field"><label>Who is setting up SATprep.io?</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <button type="button" class="btn secondary" id="chooseParent">Parent or Guardian</button>
        <button type="button" class="btn secondary" id="chooseStudent">Student</button>
      </div>
    </div>
    <div id="signupStep"><div class="notice">Choose the option that best describes who is creating the account.</div></div>`;

  document.querySelector("#chooseParent").onclick=renderParentSignup;
  document.querySelector("#chooseStudent").onclick=renderStudentAgeGate;
  replacing=false;
}

function renderParentSignup(){
  const step=document.querySelector("#signupStep");
  step.innerHTML=`<h2>Parent or Guardian</h2><p class="small">Your account will manage the household, student access, progress and billing.</p>
    <div class="field"><label>First name</label><input id="pFirst" autocomplete="given-name" required></div>
    <div class="field"><label>Last name</label><input id="pLast" autocomplete="family-name" required></div>
    <div class="field"><label>Email</label><input id="pEmail" type="email" autocomplete="email" required></div>
    <div class="field"><label>Password</label><input id="pPass" type="password" minlength="8" required></div>
    <button class="btn" id="createParent" type="button">Create parent account</button>`;
  document.querySelector("#createParent").onclick=createParent;
}

async function createParent(){
  const first_name=document.querySelector("#pFirst").value.trim();
  const last_name=document.querySelector("#pLast").value.trim();
  const email=document.querySelector("#pEmail").value.trim();
  const password=document.querySelector("#pPass").value;
  if(!first_name||!last_name||!email||password.length<8) return alert("Please complete all fields.");
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{role:"parent",first_name,last_name}}});
  if(error) return alert(error.message);
  alert(data.session?"Parent account created.":"Check your email to confirm your account, then sign in.");
}

function renderStudentAgeGate(){
  const step=document.querySelector("#signupStep");
  step.innerHTML=`<h2>Student</h2><p class="small">We ask age first so we can use the right account setup.</p>
    <div class="field"><label>How old are you?</label><select id="studentAge"><option value="">Choose age</option>${Array.from({length:14},(_,i)=>`<option value="${i+7}">${i+7}${i===13?"+":""}</option>`).join("")}</select></div>
    <button class="btn" id="ageContinue" type="button">Continue</button>`;
  document.querySelector("#ageContinue").onclick=()=>{
    const age=Number(document.querySelector("#studentAge").value);
    if(!age) return alert("Please choose your age.");
    if(age<13) renderUnder13(); else renderTeenSignup(age);
  };
}

function renderUnder13(){
  const step=document.querySelector("#signupStep");
  step.innerHTML=`<h2>Let's get a parent or guardian</h2>
    <div class="notice">Because you're under 13, a parent or guardian needs to finish setting up SATprep.io before we create your student account.</div>
    <p class="small">Enter your parent or guardian's email. We won't ask for your name or create your account yet.</p>
    <div class="field"><label>Parent or guardian email</label><input id="guardianEmail" type="email" autocomplete="email" required></div>
    <button class="btn" id="requestParent" type="button">Send setup request</button>`;
  document.querySelector("#requestParent").onclick=async()=>{
    const parent_email=document.querySelector("#guardianEmail").value.trim();
    if(!parent_email) return alert("Please enter a parent or guardian email.");
    const {error}=await supabase.from("parent_setup_requests").insert({parent_email,age_band:"under13"});
    if(error) return alert(error.message);
    step.innerHTML=`<div class="success"><strong>You're all set for now.</strong><br>We've saved the parent setup request. Your parent or guardian can create the household account and then add your student profile.</div>`;
  };
}

function renderTeenSignup(age){
  const step=document.querySelector("#signupStep");
  step.innerHTML=`<h2>Student account</h2><p class="small">You can create your learner account now. When Premium access is needed, we'll encourage you to invite a parent or guardian to manage billing.</p>
    <div class="field"><label>First name</label><input id="sFirst" autocomplete="given-name" required></div>
    <div class="field"><label>Last name</label><input id="sLast" autocomplete="family-name" required></div>
    <div class="field"><label>Date of birth</label><input id="sDob" type="date" required></div>
    <div class="field"><label>Email</label><input id="sEmail" type="email" autocomplete="email" required></div>
    <div class="field"><label>Password</label><input id="sPass" type="password" minlength="8" required></div>
    <button class="btn" id="createStudent" type="button">Create student account</button>`;
  document.querySelector("#createStudent").onclick=()=>createTeen(age);
}

async function createTeen(age){
  const first_name=document.querySelector("#sFirst").value.trim();
  const last_name=document.querySelector("#sLast").value.trim();
  const date_of_birth=document.querySelector("#sDob").value;
  const email=document.querySelector("#sEmail").value.trim();
  const password=document.querySelector("#sPass").value;
  if(!first_name||!last_name||!date_of_birth||!email||password.length<8) return alert("Please complete all fields.");
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{role:"student",first_name,last_name,date_of_birth,age_at_signup:String(age)}}});
  if(error) return alert(error.message);
  alert(data.session?"Student account created.":"Check your email to confirm your account, then sign in.");
}

async function injectStudentParentInvite(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session||document.querySelector("#parentInviteCard")) return;
  const {data:p}=await supabase.from("profiles").select("id,role,household_id,date_of_birth").eq("id",session.user.id).maybeSingle();
  if(!p||p.role!=="student"||p.household_id) return;
  const hero=document.querySelector(".hero");
  if(!hero) return;
  const card=document.createElement("div");
  card.id="parentInviteCard";
  card.className="card";
  card.style.marginTop="16px";
  card.innerHTML=`<h2>Invite a parent or guardian</h2><p class="small">Linking a parent lets them activate your trial, manage billing, see your progress and help keep your plan on track.</p>
    <div class="field"><label>Parent or guardian email</label><input id="inviteParentEmail" type="email" placeholder="parent@example.com"></div>
    <button class="btn" id="inviteParentBtn">Invite my parent</button>`;
  hero.insertAdjacentElement("afterend",card);
  document.querySelector("#inviteParentBtn").onclick=async()=>{
    const parent_email=document.querySelector("#inviteParentEmail").value.trim();
    if(!parent_email) return alert("Enter a parent or guardian email.");
    const {error}=await supabase.from("parent_invitations").insert({student_profile_id:p.id,parent_email});
    if(error) return alert(error.message);
    card.innerHTML=`<div class="success"><strong>Invitation created.</strong><br>Your parent or guardian can now be linked to your SATprep.io account. Email delivery is the next integration step.</div>`;
  };
}

async function injectParentStudentSetup(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session||document.querySelector("#addStudentCard")) return;
  const {data:p}=await supabase.from("profiles").select("id,role,household_id").eq("id",session.user.id).maybeSingle();
  if(!p||p.role!=="parent"||!p.household_id) return;
  const hero=document.querySelector(".hero")||document.querySelector("main .card");
  if(!hero) return;
  const card=document.createElement("div");
  card.id="addStudentCard";
  card.className="card";
  card.style.margin="16px auto";
  card.innerHTML=`<h2>Add a student</h2><p class="small">Create the learner profile under your household. A separate child login can be activated afterward.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="field"><label>First name</label><input id="childFirst"></div><div class="field"><label>Last name</label><input id="childLast"></div></div>
    <div class="field"><label>Grade</label><select id="childGrade">${Array.from({length:9},(_,i)=>`<option value="${i+4}">${i+4}</option>`).join("")}</select></div>
    <button class="btn" id="addStudentBtn">Add student profile</button>`;
  hero.insertAdjacentElement("afterend",card);
  document.querySelector("#addStudentBtn").onclick=async()=>{
    const first_name=document.querySelector("#childFirst").value.trim();
    const last_name=document.querySelector("#childLast").value.trim();
    const grade_level=Number(document.querySelector("#childGrade").value);
    if(!first_name||!last_name) return alert("Please enter the student's first and last name.");
    const display_name=`${first_name} ${last_name}`;
    const {error}=await supabase.from("students").insert({household_id:p.household_id,first_name,last_name,display_name,grade_level});
    if(error) return alert(error.message);
    card.innerHTML=`<div class="success"><strong>${esc(display_name)} was added.</strong><br>The learner profile now belongs to your household.</div>`;
  };
}

async function enhanceLoggedIn(){
  await injectStudentParentInvite();
  await injectParentStudentSetup();
}

const observer=new MutationObserver(()=>{
  signupWizard();
  enhanceLoggedIn();
});
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{signupWizard();enhanceLoggedIn();},0);
supabase.auth.onAuthStateChange(()=>setTimeout(enhanceLoggedIn,100));
