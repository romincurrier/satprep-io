import { supabase } from "./supabase.js";

const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));
let busy=false;

async function getProfile(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return {session:null,profile:null};
  const {data:profile}=await supabase.from("profiles").select("id,role,household_id,first_name,last_name").eq("id",session.user.id).maybeSingle();
  return {session,profile};
}

async function getHouseholdStudents(householdId){
  if(!householdId) return [];
  const {data,error}=await supabase.from("students").select("id,first_name,last_name,display_name,date_of_birth,grade_level,target_exam,target_score,created_at").eq("household_id",householdId).order("created_at",{ascending:true});
  if(error) return [];
  return data||[];
}

function childForm(title="Tell us about your child",second=false){
  return `<div class="eyebrow">${second?"ADD ANOTHER STUDENT":"STUDENT SETUP"}</div>
    <h2>${esc(title)}</h2>
    <p class="small">Start with one student. You can add another afterward if needed.</p>
    ${second?`<div class="notice">Adding a second student will require a Family plan when billing is activated.</div>`:""}
    <div id="childSaveMessage"></div>
    <form id="childSetupForm">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>First name</label><input id="childFirst" autocomplete="given-name" required></div>
        <div class="field"><label>Last name</label><input id="childLast" autocomplete="family-name" required></div>
      </div>
      <div class="field"><label>Date of birth</label><input id="childDob" type="date"></div>
      <div class="field"><label>Current grade</label><select id="childGrade">${Array.from({length:9},(_,i)=>`<option value="${i+4}">${i+4}</option>`).join("")}</select></div>
      <div class="field"><label>Primary test goal</label><select id="childExam"><option value="PSAT">PSAT</option><option value="PSAT/NMSQT">PSAT/NMSQT</option><option value="SAT">SAT</option></select></div>
      <button class="btn" id="saveChildBtn" type="submit">Save student and continue</button>
    </form>`;
}

async function saveChild(profile,container){
  if(busy) return;
  busy=true;
  const btn=document.querySelector("#saveChildBtn");
  if(btn){btn.disabled=true;btn.textContent="Saving…";}
  const first_name=document.querySelector("#childFirst")?.value.trim();
  const last_name=document.querySelector("#childLast")?.value.trim();
  const date_of_birth=document.querySelector("#childDob")?.value||null;
  const grade_level=Number(document.querySelector("#childGrade")?.value||0)||null;
  const target_exam=document.querySelector("#childExam")?.value||"PSAT";
  if(!first_name||!last_name){busy=false;if(btn){btn.disabled=false;btn.textContent="Save student and continue";}return;}

  const display_name=`${first_name} ${last_name}`;
  const {data:student,error}=await supabase.from("students").insert({
    household_id:profile.household_id,
    first_name,
    last_name,
    display_name,
    date_of_birth,
    grade_level,
    target_exam
  }).select("id,first_name,last_name,display_name,grade_level,target_exam").single();

  if(error){
    busy=false;
    if(btn){btn.disabled=false;btn.textContent="Save student and continue";}
    const m=document.querySelector("#childSaveMessage");
    if(m)m.innerHTML=`<div class="error">${esc(error.message)}</div>`;
    return;
  }

  const {error:linkError}=await supabase.from("parent_students").insert({parent_profile_id:profile.id,student_id:student.id});
  if(linkError){
    busy=false;
    if(btn){btn.disabled=false;btn.textContent="Save student and continue";}
    const m=document.querySelector("#childSaveMessage");
    if(m)m.innerHTML=`<div class="error">The student was saved, but the parent link could not be completed: ${esc(linkError.message)}</div>`;
    return;
  }

  busy=false;
  await renderParentSetup(profile,container,true,student);
}

function afterChildSaved(container,students,justSaved){
  const first=justSaved||students[students.length-1];
  container.innerHTML=`<div class="success"><strong>${esc(first?.display_name||"Student")} was saved successfully.</strong><br>The student is now linked to your family account.</div>
    <h2 style="margin-top:20px">Your family is set up.</h2>
    <p class="small">Most families start with one student. You can continue now, or add another student if you need a Family plan.</p>
    <div class="card" style="margin:14px 0;padding:14px">
      ${students.map(s=>`<div class="row" style="padding:6px 0"><div><strong>${esc(s.display_name||[s.first_name,s.last_name].filter(Boolean).join(" "))}</strong><div class="small">Grade ${s.grade_level||"—"} · ${esc(s.target_exam||"PSAT")}</div></div><span class="badge good">Saved</span></div>`).join("")}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn" id="continueParentOnboarding">Continue to plans & billing</button>
      <button class="btn secondary" id="addAnotherStudent">Add another student</button>
    </div>`;
  document.querySelector("#continueParentOnboarding")?.addEventListener("click",()=>location.assign("/?app=1&openBilling=1"));
  document.querySelector("#addAnotherStudent")?.addEventListener("click",()=>{
    container.innerHTML=childForm("Add another student",true);
    document.querySelector("#childSetupForm").onsubmit=e=>{e.preventDefault();getProfile().then(({profile})=>saveChild(profile,container));};
  });
}

async function renderParentSetup(profile,container,justSaved=false,newStudent=null){
  const students=await getHouseholdStudents(profile.household_id);
  if(justSaved||students.length){
    afterChildSaved(container,students,newStudent);
    return;
  }
  container.innerHTML=childForm();
  document.querySelector("#childSetupForm").onsubmit=e=>{e.preventDefault();saveChild(profile,container);};
}

async function injectParentSetup(){
  if(busy||document.querySelector("#parentFamilySetup")) return;
  const {profile}=await getProfile();
  if(!profile||profile.role!=="parent"||!profile.household_id) return;
  const main=document.querySelector("main");
  if(!main) return;
  const container=document.createElement("section");
  container.id="parentFamilySetup";
  container.className="card";
  container.style.maxWidth="720px";
  container.style.margin="16px auto";
  const hero=document.querySelector(".hero");
  if(hero) hero.insertAdjacentElement("afterend",container); else main.prepend(container);
  await renderParentSetup(profile,container,false,null);
}

async function injectStudentParentInvite(){
  if(document.querySelector("#parentInviteCard")) return;
  const {profile}=await getProfile();
  if(!profile||profile.role!=="student"||profile.household_id) return;
  const hero=document.querySelector(".hero");
  if(!hero) return;
  const card=document.createElement("div");
  card.id="parentInviteCard";
  card.className="card";
  card.style.marginTop="16px";
  card.innerHTML=`<h2>Invite a parent or guardian</h2><p class="small">Linking a parent lets them activate your trial, manage billing, see your progress and help keep your plan on track.</p><div class="field"><label>Parent or guardian email</label><input id="inviteParentEmail" type="email" placeholder="parent@example.com"></div><button class="btn" id="inviteParentBtn">Invite my parent</button>`;
  hero.insertAdjacentElement("afterend",card);
  document.querySelector("#inviteParentBtn").onclick=async()=>{
    const parent_email=document.querySelector("#inviteParentEmail").value.trim();
    if(!parent_email)return;
    const{error}=await supabase.from("parent_invitations").insert({student_profile_id:profile.id,parent_email});
    if(error)return alert(error.message);
    card.innerHTML=`<div class="success"><strong>Invitation created.</strong><br>Your parent or guardian can now be linked to your SATprep.io account.</div>`;
  };
}

async function enhance(){
  const params=new URLSearchParams(location.search);
  if(params.get("app")!=="1") return;
  await injectParentSetup();
  await injectStudentParentInvite();
}

const observer=new MutationObserver(()=>setTimeout(enhance,0));
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(enhance,100);
supabase.auth.onAuthStateChange(()=>setTimeout(enhance,150));
