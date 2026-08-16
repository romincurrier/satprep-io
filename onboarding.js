import { supabase } from "./supabase.js";

const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));
let busy=false;
let injectingParentSetup=false;
let enhancing=false;
let profileCache=null;

async function getProfile(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return {session:null,profile:null};
  const {data:profile}=await supabase.from("profiles").select("id,role,household_id,first_name,last_name").eq("id",session.user.id).maybeSingle();
  return {session,profile};
}
async function getHouseholdStudents(householdId){
  if(!householdId) return [];
  const {data,error}=await supabase.from("students").select("id,first_name,last_name,display_name,date_of_birth,grade_level,target_exam,target_score,created_at").eq("household_id",householdId).order("created_at",{ascending:true});
  return error?[]:(data||[]);
}
function childForm(title="Tell us about your child",additional=false){
  return `<div class="eyebrow">${additional?"ADD ANOTHER STUDENT":"STUDENT SETUP"}</div><h2>${esc(title)}</h2><p class="small">${additional?"Enter one additional student below.":"Let's start with one student. If you need another, you can add one student at a time."}</p>${additional?`<div class="notice">Adding a second student will require a Family plan when billing is activated.</div>`:""}<div id="childSaveMessage"></div><form id="childSetupForm"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="field"><label>First name</label><input id="childFirst" autocomplete="given-name" required></div><div class="field"><label>Last name</label><input id="childLast" autocomplete="family-name" required></div></div><div class="field"><label>Date of birth</label><input id="childDob" type="date"></div><div class="field"><label>Current grade</label><select id="childGrade">${Array.from({length:9},(_,i)=>`<option value="${i+4}">${i+4}</option>`).join("")}</select></div><div class="field"><label>Primary test goal</label><select id="childExam"><option value="PSAT">PSAT</option><option value="PSAT/NMSQT">PSAT/NMSQT</option><option value="SAT">SAT</option></select></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="saveAndBilling" type="button">Save & continue to billing</button><button class="btn secondary" id="saveAndAdd" type="button">Save & add another student</button></div></form>`;
}
async function saveChild(profile,container,nextAction){
  if(busy)return;busy=true;
  const buttons=[container.querySelector("#saveAndBilling"),container.querySelector("#saveAndAdd")];buttons.forEach(b=>{if(b)b.disabled=true;});
  const first_name=container.querySelector("#childFirst")?.value.trim(),last_name=container.querySelector("#childLast")?.value.trim(),date_of_birth=container.querySelector("#childDob")?.value||null,grade_level=Number(container.querySelector("#childGrade")?.value||0)||null,target_exam=container.querySelector("#childExam")?.value||"PSAT";
  if(!first_name||!last_name){busy=false;buttons.forEach(b=>{if(b)b.disabled=false;});return;}
  const display_name=`${first_name} ${last_name}`;
  const {data:student,error}=await supabase.from("students").insert({household_id:profile.household_id,first_name,last_name,display_name,date_of_birth,grade_level,target_exam}).select("id,first_name,last_name,display_name,grade_level,target_exam").single();
  if(error){busy=false;buttons.forEach(b=>{if(b)b.disabled=false;});const m=container.querySelector("#childSaveMessage");if(m)m.innerHTML=`<div class="error">${esc(error.message)}</div>`;return;}
  const {error:linkError}=await supabase.from("parent_students").upsert({parent_profile_id:profile.id,student_id:student.id},{onConflict:"parent_profile_id,student_id"});
  if(linkError){busy=false;buttons.forEach(b=>{if(b)b.disabled=false;});const m=container.querySelector("#childSaveMessage");if(m)m.innerHTML=`<div class="error">The student was saved, but the parent link could not be completed: ${esc(linkError.message)}</div>`;return;}
  busy=false;
  if(nextAction==="add"){container.innerHTML=`<div class="success"><strong>${esc(display_name)} was saved successfully.</strong></div>${childForm("Add another student",true)}`;bindChildForm(profile,container);return;}
  location.assign("/?app=1&openBilling=1");
}
function bindChildForm(profile,container){profileCache=profile;container.querySelector("#saveAndBilling")?.addEventListener("click",()=>saveChild(profile,container,"billing"));container.querySelector("#saveAndAdd")?.addEventListener("click",()=>saveChild(profile,container,"add"));}
async function renderParentSetup(profile,container){
  profileCache=profile;const students=await getHouseholdStudents(profile.household_id);
  if(students.length){container.innerHTML=`<div class="eyebrow">FAMILY SETUP</div><h2>${students.length===1?"Your student is already saved.":"Your students are already saved."}</h2><p class="small">Continue to plans & billing, or add another student if needed.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="continueParentOnboarding">Continue to plans & billing</button><button class="btn secondary" id="addAnotherStudent">Add another student</button></div>`;container.querySelector("#continueParentOnboarding")?.addEventListener("click",()=>location.assign("/?app=1&openBilling=1"));container.querySelector("#addAnotherStudent")?.addEventListener("click",()=>{container.innerHTML=childForm("Add another student",true);bindChildForm(profile,container);});return;}
  container.innerHTML=childForm();bindChildForm(profile,container);
}
async function injectParentSetup(){
  if(busy||injectingParentSetup||document.querySelector("#parentFamilySetup"))return;
  const params=new URLSearchParams(location.search);if(params.get("onboarding")!=="child"||params.get("openBilling")==="1")return;
  injectingParentSetup=true;
  try{const {profile}=await getProfile();if(!profile||profile.role!=="parent"||!profile.household_id)return;const main=document.querySelector("main");if(!main||document.querySelector("#parentFamilySetup"))return;const container=document.createElement("section");container.id="parentFamilySetup";container.className="card";container.style.maxWidth="720px";container.style.margin="16px auto";const hero=document.querySelector(".hero");if(hero)hero.insertAdjacentElement("afterend",container);else main.prepend(container);await renderParentSetup(profile,container);}finally{injectingParentSetup=false;}
}
async function injectStudentParentInvite(){
  if(document.querySelector("#parentInviteCard"))return;const params=new URLSearchParams(location.search);if(params.get("openBilling")==="1")return;
  const {profile}=await getProfile();if(!profile||profile.role!=="student"||profile.household_id)return;const hero=document.querySelector(".hero");if(!hero)return;const card=document.createElement("div");card.id="parentInviteCard";card.className="card";card.style.marginTop="16px";card.innerHTML=`<h2>Invite a parent or guardian</h2><p class="small">Linking a parent lets them activate your trial, manage billing, see your progress and help keep your plan on track.</p><div class="field"><label>Parent or guardian email</label><input id="inviteParentEmail" type="email" placeholder="parent@example.com"></div><button class="btn" id="inviteParentBtn">Invite my parent</button>`;hero.insertAdjacentElement("afterend",card);card.querySelector("#inviteParentBtn").onclick=async()=>{const parent_email=card.querySelector("#inviteParentEmail").value.trim();if(!parent_email)return;const{error}=await supabase.from("parent_invitations").insert({student_profile_id:profile.id,parent_email});if(error)return alert(error.message);card.innerHTML=`<div class="success"><strong>Invitation created.</strong><br>Your parent or guardian can now be linked to your SATprep.io account.</div>`;};
}
async function enhance(){if(enhancing)return;const params=new URLSearchParams(location.search);if(params.get("app")!=="1"||params.get("openBilling")==="1")return;enhancing=true;try{if(params.get("onboarding")==="child")await injectParentSetup();await injectStudentParentInvite();}finally{enhancing=false;}}
const observer=new MutationObserver(()=>setTimeout(enhance,0));observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(enhance,100);supabase.auth.onAuthStateChange(()=>setTimeout(enhance,150));
