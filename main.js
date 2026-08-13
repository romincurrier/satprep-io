import "./style.css";
import { supabase, configured } from "./supabase.js";
import { CURRICULUM } from "./curriculum.js";

const app = document.querySelector("#app");
let session = null;
let profile = null;
let student = null;
let progress = {};
let skills = {};
let lessonState = null;
let authMode = "login";

const esc = s => String(s ?? "").replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const pct = x => Math.round((x || 0) * 100);

function top(){
  return `<div class="top"><div class="logo">SAT<span>prep.io</span></div><div class="navlinks">
  ${session ? `<button class="linkbtn" id="dashBtn">Dashboard</button><button class="linkbtn" id="signoutBtn">Sign out</button>` : ""}
  </div></div>`;
}

function bindTop(){
  document.querySelector("#dashBtn")?.addEventListener("click", ()=>{ lessonState=null; renderDashboard(); });
  document.querySelector("#signoutBtn")?.addEventListener("click", async()=>{ await supabase.auth.signOut(); });
}

function renderConfig(){
  app.innerHTML = top()+`<main class="wrap"><div class="auth"><div class="card">
    <h1>SATprep.io</h1>
    <div class="notice"><strong>Application is ready for its cloud connection.</strong><br><br>
    Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> as environment variables in Hostinger after creating the Supabase project.</div>
    <p class="small">The repository can be deployed now, but account creation and cross-device synchronization begin after the Supabase credentials are connected.</p>
  </div></div></main>`;
}

function renderAuth(message=""){
  app.innerHTML = top()+`<main class="wrap"><div class="auth"><div class="card">
    <h1 style="margin-bottom:4px">Welcome to SATprep.io</h1>
    <p class="muted">Adaptive SAT and PSAT preparation that learns the student.</p>
    <div class="tabs"><button class="tab ${authMode==="login"?"active":""}" id="loginTab">Sign in</button><button class="tab ${authMode==="signup"?"active":""}" id="signupTab">Create account</button></div>
    ${message ? `<div class="${message.startsWith("Check")?"success":"error"}">${esc(message)}</div>`:""}
    <form id="authForm">
      ${authMode==="signup" ? `<div class="field"><label>Account type</label><select id="role"><option value="student">Student</option><option value="parent">Parent</option></select></div><div class="field"><label>First name</label><input id="firstName" required /></div>`:""}
      <div class="field"><label>Email</label><input id="email" type="email" autocomplete="email" required /></div>
      <div class="field"><label>Password</label><input id="password" type="password" minlength="8" required /></div>
      <button class="btn" type="submit">${authMode==="login"?"Sign in":"Create account"}</button>
    </form>
  </div></div></main>`;
  document.querySelector("#loginTab").onclick=()=>{authMode="login";renderAuth()};
  document.querySelector("#signupTab").onclick=()=>{authMode="signup";renderAuth()};
  document.querySelector("#authForm").onsubmit=handleAuth;
}

async function handleAuth(e){
  e.preventDefault();
  const email=document.querySelector("#email").value.trim();
  const password=document.querySelector("#password").value;
  if(authMode==="login"){
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error) renderAuth(error.message);
  }else{
    const role=document.querySelector("#role").value;
    const first_name=document.querySelector("#firstName").value.trim();
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{role,first_name}}});
    if(error) return renderAuth(error.message);
    if(!data.session) renderAuth("Check your email to confirm your account, then sign in.");
  }
}

async function loadData(){
  const uid=session.user.id;
  const {data:p}=await supabase.from("profiles").select("*").eq("id",uid).maybeSingle();
  profile=p;
  if(!profile) return;

  if(profile.role==="student"){
    const {data:s}=await supabase.from("students").select("*").eq("profile_id",uid).maybeSingle();
    student=s;
  }else if(profile.role==="parent"){
    const {data:links}=await supabase.from("parent_students").select("student_id").eq("parent_profile_id",uid).limit(1);
    if(links?.length){
      const {data:s}=await supabase.from("students").select("*").eq("id",links[0].student_id).maybeSingle();
      student=s;
    }
  }

  if(student){
    const {data:pr}=await supabase.from("lesson_progress").select("*").eq("student_id",student.id);
    progress=Object.fromEntries((pr||[]).map(x=>[x.lesson_key,x]));
    const {data:sk}=await supabase.from("skill_mastery").select("*").eq("student_id",student.id);
    skills=Object.fromEntries((sk||[]).map(x=>[x.skill_key,x]));
  }
}

function roleDashboard(){
  if(profile.role==="admin") return renderAdmin();
  if(profile.role==="parent") return renderParent();
  return renderStudent();
}

function renderDashboard(){ roleDashboard(); }

function renderStudent(){
  if(!student?.onboarding_complete) return renderOnboarding();
  const done=Object.keys(progress).filter(k=>progress[k].best_score!=null).length;
  const avg=done ? Object.values(progress).filter(x=>x.best_score!=null).reduce((a,b)=>a+Number(b.best_score),0)/done : 0;
  const next=CURRICULUM.find(l=>unlocked(l)&&!progress[l.id]?.completed_at);
  app.innerHTML=top()+`<main class="wrap">
  <section class="hero"><h1>Welcome back, ${esc(profile.first_name)}.</h1><p>Learn the skill. Prove mastery. Keep moving toward ${student.target_score || "your target"}.</p></section>
  <section class="grid">
    <div class="card c3"><div class="label">Lessons Complete</div><div class="metric">${done}</div></div>
    <div class="card c3"><div class="label">Average Mastery</div><div class="metric">${pct(avg)}%</div></div>
    <div class="card c3"><div class="label">Target Score</div><div class="metric">${student.target_score || "—"}</div></div>
    <div class="card c3"><div class="label">Exam</div><div class="metric" style="font-size:23px">${esc(student.target_exam || "PSAT")}</div></div>
    <div class="card c8"><h2>Learning Path</h2>${CURRICULUM.map(l=>{
      const u=unlocked(l), p=progress[l.id];
      return `<div class="lesson ${u?"":"locked"}"><div><strong>Week ${l.week} — ${esc(l.title)}</strong><div class="small">${esc(l.domain)}</div></div><div class="right">${p?.best_score!=null?`<span class="badge ${Number(p.best_score)>=.8?"good":"warn"}">${pct(Number(p.best_score))}%</span>`:u?`<span class="badge">Ready</span>`:`<span class="badge warn">Locked</span>`}<button class="btn" data-lesson="${l.id}" ${u?"":"disabled"}>${p?.completed_at?"Review":"Start"}</button></div></div>`;
    }).join("")}</div>
    <div class="card c4"><h2>Next Mission</h2>${next?`<p><strong>${esc(next.title)}</strong></p><p class="small">${esc(next.domain)}</p><button class="btn" data-lesson="${next.id}">Begin</button>`:`<p>Current assigned lessons are complete.</p>`}<hr><div class="notice">Your work is stored online. Sign in from another device and your account will use the same progress.</div></div>
  </section></main><footer>SATprep.io · Adaptive preparation</footer>`;
  bindTop();
  document.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>startLesson(b.dataset.lesson));
}

function unlocked(l){
  if(!l.prerequisite) return true;
  const p=progress[l.prerequisite];
  return p && Number(p.best_score)>=l.required;
}

function renderOnboarding(){
  app.innerHTML=top()+`<main class="wrap"><div class="auth"><div class="card">
  <h1>Build your learner profile</h1><p class="muted">This gives SATprep.io a starting point. The diagnostic will verify and refine it.</p>
  <form id="onboard">
   <div class="field"><label>Current grade</label><select id="grade">${Array.from({length:9},(_,i)=>`<option value="${i+4}">${i+4}</option>`).join("")}</select></div>
   <div class="field"><label>Current math course</label><input id="mathCourse" placeholder="Example: Pre-Algebra" /></div>
   <div class="field"><label>Target exam</label><select id="targetExam"><option>PSAT</option><option>PSAT/NMSQT</option><option>SAT</option></select></div>
   <div class="field"><label>Target score</label><input id="targetScore" type="number" min="400" max="1600" step="10" value="1300" /></div>
   <div class="field"><label>Target test date</label><input id="targetDate" type="date" /></div>
   <div class="field"><label>Prior testing / notes</label><input id="prior" placeholder="CTP, MAP, prior PSAT, or none" /></div>
   <button class="btn">Save & begin</button>
  </form></div></div></main>`;
  bindTop();
  document.querySelector("#onboard").onsubmit=async e=>{
    e.preventDefault();
    const updates={
      grade_level:Number(document.querySelector("#grade").value),
      math_course:document.querySelector("#mathCourse").value,
      target_exam:document.querySelector("#targetExam").value,
      target_score:Number(document.querySelector("#targetScore").value),
      target_date:document.querySelector("#targetDate").value||null,
      prior_testing_notes:document.querySelector("#prior").value,
      onboarding_complete:true
    };
    const {error}=await supabase.from("students").update(updates).eq("id",student.id);
    if(error) return alert(error.message);
    Object.assign(student,updates); renderStudent();
  };
}

function startLesson(id){
  const lesson=CURRICULUM.find(x=>x.id===id);
  const p=progress[id];
  lessonState={lesson,index:p?.current_question||0,selected:null,checked:false,started:Date.now(),correct:0,answered:0};
  renderLesson();
}

function renderLesson(){
  const {lesson,index}=lessonState, q=lesson.qs[index];
  app.innerHTML=top()+`<main class="wrap"><div class="card">
  <div class="row"><div><div class="small">${esc(lesson.domain)}</div><h2 style="margin:3px 0">${esc(lesson.title)}</h2></div><button class="btn secondary" id="pauseBtn">Pause</button></div>
  <div class="progress"><div style="width:${Math.round(index/lesson.qs.length*100)}%"></div></div><div class="small" style="margin-top:6px">Question ${index+1} of ${lesson.qs.length}</div>
  ${q.p?`<div class="passage" style="margin-top:15px">${esc(q.p)}</div>`:""}
  <div class="question">${esc(q.q)}</div>
  ${q.o.map((o,i)=>`<button class="option ${lessonState.selected===i?"sel":""}" data-choice="${i}"><strong>${String.fromCharCode(65+i)}.</strong> ${esc(o)}</button>`).join("")}
  ${lessonState.checked?`<div class="feedback ${lessonState.selected===q.a?"ok":"no"}"><strong>${lessonState.selected===q.a?"Correct":"Not yet"}</strong><br>${esc(q.e)}</div>`:""}
  <div class="row" style="margin-top:16px"><span></span>${lessonState.checked?`<button class="btn" id="nextBtn">${index===lesson.qs.length-1?"Finish lesson":"Next"}</button>`:`<button class="btn" id="checkBtn" ${lessonState.selected===null?"disabled":""}>Check answer</button>`}</div>
  </div></main>`;
  bindTop();
  document.querySelector("#pauseBtn").onclick=pauseLesson;
  document.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>{lessonState.selected=Number(b.dataset.choice);renderLesson()});
  document.querySelector("#checkBtn")?.addEventListener("click",checkAnswer);
  document.querySelector("#nextBtn")?.addEventListener("click",nextQuestion);
}

async function checkAnswer(){
  const {lesson,index}=lessonState, q=lesson.qs[index];
  lessonState.checked=true; lessonState.answered++;
  const ok=lessonState.selected===q.a;
  if(ok) lessonState.correct++;
  await supabase.from("question_attempts").insert({
    student_id:student.id, lesson_key:lesson.id, question_index:index, skill_key:q.skill,
    selected_answer:lessonState.selected, correct_answer:q.a, is_correct:ok,
    response_ms:Date.now()-lessonState.started
  });
  await upsertSkill(q.skill,ok);
  await savePosition(index);
  renderLesson();
}

async function upsertSkill(skill,ok){
  const old=skills[skill];
  const oldM=old?Number(old.mastery):0;
  const oldN=old?.items_attempted||0;
  const obs=ok?1:0;
  const newM=oldN===0?obs:(oldM*.72+obs*.28);
  const payload={student_id:student.id,skill_key:skill,mastery:newM,items_attempted:oldN+1,updated_at:new Date().toISOString()};
  await supabase.from("skill_mastery").upsert(payload,{onConflict:"student_id,skill_key"});
  skills[skill]=payload;
}

async function savePosition(index){
  const old=progress[lessonState.lesson.id];
  const payload={student_id:student.id,lesson_key:lessonState.lesson.id,current_question:index,updated_at:new Date().toISOString(),best_score:old?.best_score??null};
  await supabase.from("lesson_progress").upsert(payload,{onConflict:"student_id,lesson_key"});
  progress[lessonState.lesson.id]={...old,...payload};
}

async function pauseLesson(){
  await savePosition(lessonState.index);
  lessonState=null; renderStudent();
}

async function nextQuestion(){
  if(lessonState.index<lessonState.lesson.qs.length-1){
    lessonState.index++;lessonState.selected=null;lessonState.checked=false;lessonState.started=Date.now();await savePosition(lessonState.index);renderLesson();
  }else{
    const l=lessonState.lesson;
    const attemptScore=lessonState.answered?lessonState.correct/lessonState.answered:0;
    const old=progress[l.id];
    const best=Math.max(Number(old?.best_score||0),attemptScore);
    const payload={student_id:student.id,lesson_key:l.id,current_question:0,best_score:best,last_score:attemptScore,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    await supabase.from("lesson_progress").upsert(payload,{onConflict:"student_id,lesson_key"});
    progress[l.id]=payload; lessonState=null; alert(`Lesson complete — ${pct(attemptScore)}% this attempt.`);renderStudent();
  }
}

function renderParent(){
  if(!student){
    app.innerHTML=top()+`<main class="wrap"><div class="card"><h1>Parent Dashboard</h1><div class="notice">No student is linked to this parent account yet. An administrator can link a student after both accounts are created.</div></div></main>`;
    bindTop();return;
  }
  const sk=Object.entries(skills).sort((a,b)=>Number(a[1].mastery)-Number(b[1].mastery));
  app.innerHTML=top()+`<main class="wrap"><section class="hero"><h1>Parent Dashboard</h1><p>${esc(student.display_name || "Student")} · ${esc(student.target_exam||"PSAT")} target ${student.target_score||"—"}</p></section>
  <section class="grid"><div class="card c5"><h2>Skill Mastery</h2>${sk.length?sk.map(([k,v])=>`<div class="skill"><div class="head"><span>${esc(k)}</span><strong>${pct(Number(v.mastery))}%</strong></div><div class="progress"><div style="width:${pct(Number(v.mastery))}%"></div></div></div>`).join(""):`<p class="small">Skill data will appear after lessons begin.</p>`}</div>
  <div class="card c7"><h2>Lesson History</h2>${CURRICULUM.map(l=>{const p=progress[l.id];return `<div class="lesson"><div><strong>${esc(l.title)}</strong><div class="small">${esc(l.domain)}</div></div><span class="badge">${p?.best_score!=null?pct(Number(p.best_score))+"%":"Not completed"}</span></div>`}).join("")}</div></section></main>`;
  bindTop();
}

function renderAdmin(){
 app.innerHTML=top()+`<main class="wrap"><section class="hero"><h1>Administrator</h1><p>Platform controls and account management.</p></section><div class="grid"><div class="card c6"><h2>Current MVP</h2><p>Multi-user authentication, learner profiles, student progress, parent linking, skill mastery, and cloud-saved lesson state.</p></div><div class="card c6"><h2>Next build</h2><p>Admin student search, parent/student linking UI, assessment upload intake, question-bank editor, adaptive remediation rules, and expanded curriculum.</p></div></div></main>`;
 bindTop();
}

async function boot(){
  if(!configured) return renderConfig();
  const {data:{session:s}}=await supabase.auth.getSession();
  session=s;
  supabase.auth.onAuthStateChange(async(_event,s2)=>{session=s2;if(!session){profile=null;student=null;progress={};skills={};renderAuth();}else{await loadData();roleDashboard();}});
  if(!session) return renderAuth();
  await loadData(); roleDashboard();
}
boot();
