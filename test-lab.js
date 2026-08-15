import { supabase, configured } from "./supabase.js";
import { CURRICULUM } from "./curriculum.js";

const app = document.querySelector("#app");
let session = null;
let profile = null;
let testStudent = null;
let run = null;
let lessonState = null;

const esc = s => String(s ?? "").replace(/[&<>\"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));
const pct = x => Math.round((x || 0) * 100);

function shell(content){
  app.innerHTML = `<div class="top"><div class="logo">SAT<span>prep.io</span> <span class="badge warn">TEST LAB</span></div><div class="navlinks"><a class="linkbtn" href="/">Main App</a><button class="linkbtn" id="signoutBtn">Sign out</button></div></div><main class="wrap">${content}</main>`;
  document.querySelector("#signoutBtn")?.addEventListener("click", async()=>{ await supabase.auth.signOut(); location.href="/"; });
}

async function event(type,key,payload={}){
  if(!run) return;
  await supabase.from("test_events").insert({test_run_id:run.id,event_type:type,event_key:key,payload});
}

async function loadOrCreateTestStudent(){
  const {data:list}=await supabase.from("students").select("*").eq("is_test_student",true).order("created_at",{ascending:false}).limit(1);
  if(list?.length){ testStudent=list[0]; return; }
  const label=`QA Test Learner ${new Date().toISOString().slice(0,10)}`;
  const {data,error}=await supabase.from("students").insert({
    display_name:"Test Student",
    grade_level:5,
    math_course:"Pre-Algebra",
    target_exam:"PSAT",
    target_score:1300,
    onboarding_complete:false,
    is_test_student:true,
    test_label:label
  }).select().single();
  if(error) throw error;
  testStudent=data;
}

async function resetTestStudent(){
  if(!testStudent) return;
  await Promise.all([
    supabase.from("lesson_progress").delete().eq("student_id",testStudent.id),
    supabase.from("skill_mastery").delete().eq("student_id",testStudent.id),
    supabase.from("question_attempts").delete().eq("student_id",testStudent.id)
  ]);
  await supabase.from("students").update({
    display_name:"Test Student",
    grade_level:5,
    math_course:"Pre-Algebra",
    target_exam:"PSAT",
    target_score:1300,
    target_date:null,
    prior_testing_notes:null,
    onboarding_complete:false
  }).eq("id",testStudent.id);
  testStudent={...testStudent,display_name:"Test Student",grade_level:5,math_course:"Pre-Algebra",target_exam:"PSAT",target_score:1300,target_date:null,prior_testing_notes:null,onboarding_complete:false};
  if(run) await supabase.from("test_runs").update({status:"reset",completed_at:new Date().toISOString()}).eq("id",run.id);
  run=null; lessonState=null; renderHome("Test learner reset. All test progress and attempts were cleared.");
}

async function startRun(type,label){
  if(run?.status==="active") await supabase.from("test_runs").update({status:"abandoned",completed_at:new Date().toISOString()}).eq("id",run.id);
  const {data,error}=await supabase.from("test_runs").insert({tester_profile_id:profile.id,test_student_id:testStudent.id,run_type:type,label}).select().single();
  if(error) throw error;
  run=data;
  await event("run_started",type,{label});
}

function renderHome(message=""){
  shell(`<section class="hero"><h1>SATprep.io Test Lab</h1><p>Isolated sandbox for onboarding, questions, diagnostics, lessons, and billing-flow testing. Test activity never contributes to a real learner's mastery or journey.</p></section>
  ${message?`<div class="success">${esc(message)}</div>`:""}
  <section class="grid">
    <div class="card c4"><div class="label">Test Learner</div><div class="metric" style="font-size:24px">${esc(testStudent?.display_name||"Not created")}</div><p class="small">${esc(testStudent?.test_label||"")}</p></div>
    <div class="card c4"><div class="label">Mode</div><div class="metric" style="font-size:24px">Sandbox</div><p class="small">Excluded from real-user learning data.</p></div>
    <div class="card c4"><div class="label">Target</div><div class="metric">${testStudent?.target_score||1300}</div><p class="small">PSAT test profile</p></div>
    <div class="card c6"><h2>Onboarding Tester</h2><p>Run the learner-profile setup repeatedly. Reset it at any time without affecting any real account.</p><button class="btn" id="onboardingBtn">Run onboarding test</button></div>
    <div class="card c6"><h2>Question & Lesson Tester</h2><p>Choose any current lesson and answer questions as the synthetic learner. Attempts and mastery stay attached only to the test student.</p><button class="btn" id="lessonBtn">Test questions</button></div>
    <div class="card c6"><h2>Full Journey Test</h2><p>Start a tracked test run that can later cover signup, parent invitation, diagnostic, plan selection, checkout, and lesson progression.</p><button class="btn secondary" id="journeyBtn">Start full-journey run</button></div>
    <div class="card c6"><h2>Reset Sandbox</h2><p>Clear test lesson progress, mastery, attempts, and onboarding state. This never touches real students.</p><button class="btn secondary" id="resetBtn">Reset test learner</button></div>
  </section>`);
  document.querySelector("#onboardingBtn").onclick=async()=>{await startRun("onboarding","Onboarding QA");renderOnboarding();};
  document.querySelector("#lessonBtn").onclick=async()=>{await startRun("question","Question QA");renderLessonPicker();};
  document.querySelector("#journeyBtn").onclick=async()=>{await startRun("full_journey","End-to-end onboarding QA");renderJourney();};
  document.querySelector("#resetBtn").onclick=resetTestStudent;
}

function renderOnboarding(){
  shell(`<div class="card"><div class="row"><div><div class="badge warn">TEST MODE</div><h1>Build your learner profile</h1><p class="muted">This mirrors the real learner setup, but saves only to the synthetic test student.</p></div><button class="btn secondary" id="backBtn">Exit test</button></div>
  <form id="onboard">
   <div class="field"><label>Student first name</label><input id="studentFirst" value="Test" required /></div>
   <div class="field"><label>Student last name</label><input id="studentLast" value="Student" required /></div>
   <div class="field"><label>Current grade</label><select id="grade">${Array.from({length:9},(_,i)=>`<option value="${i+4}" ${i+4===5?"selected":""}>${i+4}</option>`).join("")}</select></div>
   <div class="field"><label>Current math course</label><input id="mathCourse" value="Pre-Algebra" /></div>
   <div class="field"><label>Target exam</label><select id="targetExam"><option>PSAT</option><option>PSAT/NMSQT</option><option>SAT</option></select></div>
   <div class="field"><label>Target score</label><input id="targetScore" type="number" min="400" max="1600" step="10" value="1300" /></div>
   <div class="field"><label>Target test date</label><input id="targetDate" type="date" /></div>
   <div class="field"><label>Prior testing / notes</label><input id="prior" placeholder="CTP, MAP, prior PSAT, or none" /></div>
   <button class="btn">Complete test onboarding</button>
  </form></div>`);
  document.querySelector("#backBtn").onclick=()=>renderHome();
  document.querySelector("#onboard").onsubmit=async e=>{
    e.preventDefault();
    const display_name=[document.querySelector("#studentFirst").value.trim(),document.querySelector("#studentLast").value.trim()].filter(Boolean).join(" ");
    const updates={display_name,grade_level:Number(document.querySelector("#grade").value),math_course:document.querySelector("#mathCourse").value,target_exam:document.querySelector("#targetExam").value,target_score:Number(document.querySelector("#targetScore").value),target_date:document.querySelector("#targetDate").value||null,prior_testing_notes:document.querySelector("#prior").value,onboarding_complete:true};
    const {error}=await supabase.from("students").update(updates).eq("id",testStudent.id);
    if(error) return alert(error.message);
    Object.assign(testStudent,updates);
    await event("onboarding_completed","learner_profile",updates);
    await supabase.from("test_runs").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",run.id);
    renderHome("Onboarding test completed successfully.");
  };
}

function renderLessonPicker(){
  shell(`<section class="hero"><h1>Question & Lesson Tester</h1><p>Choose any live curriculum lesson. Results are isolated to ${esc(testStudent.display_name)}.</p></section><div class="card"><div class="row"><h2>Current curriculum</h2><button class="btn secondary" id="backBtn">Exit test</button></div>${CURRICULUM.map(l=>`<div class="lesson"><div><strong>Week ${l.week} — ${esc(l.title)}</strong><div class="small">${esc(l.domain)} · ${l.qs.length} questions</div></div><button class="btn" data-testlesson="${l.id}">Test</button></div>`).join("")}</div>`);
  document.querySelector("#backBtn").onclick=()=>renderHome();
  document.querySelectorAll("[data-testlesson]").forEach(b=>b.onclick=()=>startLesson(b.dataset.testlesson));
}

async function startLesson(id){
  const lesson=CURRICULUM.find(x=>x.id===id);
  lessonState={lesson,index:0,selected:null,checked:false,correct:0,answered:0,started:Date.now()};
  await event("lesson_started",lesson.id,{title:lesson.title});
  renderLesson();
}

function renderLesson(){
  const {lesson,index}=lessonState, q=lesson.qs[index];
  shell(`<div class="card"><div class="row"><div><span class="badge warn">TEST MODE</span><div class="small">${esc(lesson.domain)}</div><h2>${esc(lesson.title)}</h2></div><button class="btn secondary" id="stopBtn">Stop test</button></div><div class="progress"><div style="width:${Math.round(index/lesson.qs.length*100)}%"></div></div><div class="small">Question ${index+1} of ${lesson.qs.length}</div>${q.p?`<div class="passage" style="margin-top:15px">${esc(q.p)}</div>`:""}<div class="question">${esc(q.q)}</div>${q.o.map((o,i)=>`<button class="option ${lessonState.selected===i?"sel":""}" data-choice="${i}"><strong>${String.fromCharCode(65+i)}.</strong> ${esc(o)}</button>`).join("")}${lessonState.checked?`<div class="feedback ${lessonState.selected===q.a?"ok":"no"}"><strong>${lessonState.selected===q.a?"Correct":"Not yet"}</strong><br>${esc(q.e)}</div>`:""}<div class="row" style="margin-top:16px"><span></span>${lessonState.checked?`<button class="btn" id="nextBtn">${index===lesson.qs.length-1?"Finish test":"Next"}</button>`:`<button class="btn" id="checkBtn" ${lessonState.selected===null?"disabled":""}>Check answer</button>`}</div></div>`);
  document.querySelector("#stopBtn").onclick=()=>renderHome();
  document.querySelectorAll("[data-choice]").forEach(b=>b.onclick=()=>{lessonState.selected=Number(b.dataset.choice);renderLesson();});
  document.querySelector("#checkBtn")?.addEventListener("click",checkAnswer);
  document.querySelector("#nextBtn")?.addEventListener("click",nextQuestion);
}

async function checkAnswer(){
  const {lesson,index}=lessonState, q=lesson.qs[index];
  const ok=lessonState.selected===q.a;
  lessonState.checked=true; lessonState.answered++; if(ok) lessonState.correct++;
  await supabase.from("question_attempts").insert({student_id:testStudent.id,lesson_key:lesson.id,question_index:index,skill_key:q.skill,selected_answer:lessonState.selected,correct_answer:q.a,is_correct:ok,response_ms:Date.now()-lessonState.started});
  const {data:old}=await supabase.from("skill_mastery").select("*").eq("student_id",testStudent.id).eq("skill_key",q.skill).maybeSingle();
  const oldM=old?Number(old.mastery):0, oldN=old?.items_attempted||0, obs=ok?1:0;
  const newM=oldN===0?obs:(oldM*.72+obs*.28);
  await supabase.from("skill_mastery").upsert({student_id:testStudent.id,skill_key:q.skill,mastery:newM,items_attempted:oldN+1,updated_at:new Date().toISOString()},{onConflict:"student_id,skill_key"});
  await event("question_answered",`${lesson.id}:${index}`,{skill:q.skill,correct:ok,selected:lessonState.selected,answer:q.a});
  renderLesson();
}

async function nextQuestion(){
  if(lessonState.index<lessonState.lesson.qs.length-1){lessonState.index++;lessonState.selected=null;lessonState.checked=false;lessonState.started=Date.now();renderLesson();return;}
  const score=lessonState.answered?lessonState.correct/lessonState.answered:0;
  await supabase.from("lesson_progress").upsert({student_id:testStudent.id,lesson_key:lessonState.lesson.id,current_question:0,best_score:score,last_score:score,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"student_id,lesson_key"});
  await event("lesson_completed",lessonState.lesson.id,{score});
  await supabase.from("test_runs").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",run.id);
  lessonState=null; renderHome(`Question test complete — ${pct(score)}%.`);
}

function renderJourney(){
  shell(`<section class="hero"><span class="badge warn">TEST MODE</span><h1>Full Journey Test</h1><p>This run is now tracked separately. It will become the place where we test the entire parent/student onboarding sequence without creating real learner history.</p></section><section class="grid"><div class="card c4"><h2>1. Signup</h2><p class="small">Parent-led, teen-led, and under-13 routing.</p></div><div class="card c4"><h2>2. Household</h2><p class="small">Parent invitation, consent, student linking.</p></div><div class="card c4"><h2>3. Premium</h2><p class="small">Plan selection and Stripe test checkout.</p></div><div class="card c4"><h2>4. Diagnostic</h2><p class="small">Baseline skills and recommendations.</p></div><div class="card c4"><h2>5. Learning</h2><p class="small">Lessons, mastery, pause/resume.</p></div><div class="card c4"><h2>6. Parent View</h2><p class="small">Progress, goals, and billing.</p></div><div class="card c12"><div class="notice">The data layer for this test run is active. The interactive step-by-step household onboarding simulator is the next Test Lab module.</div><button class="btn secondary" id="backBtn">Back to Test Lab</button></div></section>`);
  document.querySelector("#backBtn").onclick=()=>renderHome();
}

async function boot(){
  if(!configured) return shell(`<div class="card"><h1>Test Lab</h1><div class="error">Supabase is not configured.</div></div>`);
  const {data:{session:s}}=await supabase.auth.getSession(); session=s;
  if(!session){ location.href="/"; return; }
  const {data:p}=await supabase.from("profiles").select("*").eq("id",session.user.id).maybeSingle(); profile=p;
  if(!profile || profile.role!=="admin"){ return shell(`<div class="card"><h1>Test Lab</h1><div class="error">Administrator access is required.</div></div>`); }
  try{ await loadOrCreateTestStudent(); renderHome(); }catch(e){ shell(`<div class="card"><h1>Test Lab</h1><div class="error">${esc(e.message)}</div></div>`); }
}
boot();
