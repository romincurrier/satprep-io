import { supabase } from "./supabase.js";

const esc=s=>String(s??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[m]));
let rendering=false;

async function getContext(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session)return null;
  const {data:profile}=await supabase.from("profiles").select("id,email,first_name,last_name,role,household_id").eq("id",session.user.id).maybeSingle();
  if(!profile||profile.role!=="parent"||!profile.household_id)return null;
  const {data:students}=await supabase.from("students").select("id,first_name,last_name,display_name,grade_level,target_exam,target_score,onboarding_complete,created_at").eq("household_id",profile.household_id).order("created_at",{ascending:true});
  return {session,profile,students:students||[]};
}

async function studentSummary(student){
  const [{data:progress},{data:skills},{data:attempts}]=await Promise.all([
    supabase.from("lesson_progress").select("lesson_key,best_score,completed_at").eq("student_id",student.id),
    supabase.from("skill_mastery").select("skill_key,mastery,items_attempted").eq("student_id",student.id),
    supabase.from("question_attempts").select("id,is_correct,created_at").eq("student_id",student.id).order("created_at",{ascending:false}).limit(50)
  ]);
  const completed=(progress||[]).filter(x=>x.completed_at).length;
  const masteryValues=(skills||[]).map(x=>Number(x.mastery||0));
  const avgMastery=masteryValues.length?Math.round(masteryValues.reduce((a,b)=>a+b,0)/masteryValues.length*100):0;
  const weakest=(skills||[]).slice().sort((a,b)=>Number(a.mastery)-Number(b.mastery))[0];
  const strongest=(skills||[]).slice().sort((a,b)=>Number(b.mastery)-Number(a.mastery))[0];
  const recent=attempts||[];
  const accuracy=recent.length?Math.round(recent.filter(x=>x.is_correct).length/recent.length*100):0;
  return {completed,avgMastery,weakest,strongest,accuracy,attemptCount:recent.length};
}

function studentCard(student,summary){
  const name=student.display_name||[student.first_name,student.last_name].filter(Boolean).join(" ")||"Student";
  const status=student.onboarding_complete?"Learning profile ready":"Setup in progress";
  return `<article class="card" style="padding:22px">
    <div class="row"><div><div class="eyebrow" style="margin-bottom:8px">STUDENT</div><h2 style="margin:0 0 5px">${esc(name)}</h2><div class="small">Grade ${student.grade_level||"—"} · ${esc(student.target_exam||"PSAT")} · Target ${student.target_score||"—"}</div></div><span class="badge ${student.onboarding_complete?"good":"warn"}">${esc(status)}</span></div>
    <div class="grid" style="margin-top:18px">
      <div class="c3"><div class="label">Lessons</div><div class="metric" style="font-size:24px">${summary.completed}</div></div>
      <div class="c3"><div class="label">Mastery</div><div class="metric" style="font-size:24px">${summary.avgMastery}%</div></div>
      <div class="c3"><div class="label">Recent accuracy</div><div class="metric" style="font-size:24px">${summary.attemptCount?summary.accuracy+"%":"—"}</div></div>
      <div class="c3"><div class="label">Questions</div><div class="metric" style="font-size:24px">${summary.attemptCount}</div></div>
    </div>
    <hr>
    <div class="row"><div class="small">${summary.strongest?`Strongest: <strong>${esc(summary.strongest.skill_key)}</strong>`:"Performance insights will appear after the student begins working."}${summary.weakest?`<br>Needs attention: <strong>${esc(summary.weakest.skill_key)}</strong>`:""}</div><button class="btn secondary student-detail" data-student="${student.id}">View student</button></div>
  </article>`;
}

async function render(){
  if(rendering)return;
  const params=new URLSearchParams(location.search);
  if(params.get("app")!=="1"||params.get("openBilling")==="1"||params.get("onboarding")==="child")return;
  const ctx=await getContext();if(!ctx)return;
  const main=document.querySelector("main");if(!main||document.querySelector("#parentDashboardEnhanced"))return;
  rendering=true;
  try{
    const summaries=await Promise.all(ctx.students.map(studentSummary));
    main.id="parentDashboardEnhanced";
    main.className="wrap";
    main.innerHTML=`<section class="hero"><div class="row" style="align-items:flex-start"><div><div class="eyebrow">PARENT DASHBOARD</div><h1>Welcome, ${esc(ctx.profile.first_name||"Parent")}.</h1><p>See each student's preparation, progress and next steps in one place.</p></div><button class="btn" id="manageBilling">Plans & Billing</button></div></section>
      <section class="grid"><div class="card c3"><div class="label">Students</div><div class="metric">${ctx.students.length}</div></div><div class="card c3"><div class="label">Household plan</div><div class="metric" style="font-size:21px">${ctx.students.length>1?"Family":"Individual"}</div></div><div class="card c3"><div class="label">Active learners</div><div class="metric">${ctx.students.filter(s=>s.onboarding_complete).length}</div></div><div class="card c3"><div class="label">Account</div><div class="metric" style="font-size:17px">Parent</div></div></section>
      <section style="display:grid;gap:16px;margin-top:18px">${ctx.students.length?ctx.students.map((s,i)=>studentCard(s,summaries[i])).join(""):`<div class="card"><h2>Add your first student</h2><p class="muted">Your family account is ready. Add a student to begin building a personalized SAT or PSAT learning path.</p><button class="btn" id="addFirstStudent">Add student</button></div>`}</section>
      <section class="card" style="margin-top:18px"><div class="row"><div><h2 style="margin-bottom:5px">Family & account</h2><div class="small">Manage students, billing, privacy and account access.</div></div><button class="btn secondary" id="addStudentFromDashboard">Add another student</button></div></section>`;
    document.querySelector("#manageBilling")?.addEventListener("click",()=>location.assign("/?app=1&openBilling=1"));
    document.querySelector("#addFirstStudent")?.addEventListener("click",()=>location.assign("/?app=1&onboarding=child"));
    document.querySelector("#addStudentFromDashboard")?.addEventListener("click",()=>location.assign("/?app=1&onboarding=child"));
    document.querySelectorAll(".student-detail").forEach(btn=>btn.addEventListener("click",()=>showStudent(ctx.students.find(s=>s.id===btn.dataset.student),summaries[ctx.students.findIndex(s=>s.id===btn.dataset.student)])));
  }finally{rendering=false;}
}

function showStudent(student,summary){
  const main=document.querySelector("main");if(!main||!student)return;
  const name=student.display_name||[student.first_name,student.last_name].filter(Boolean).join(" ")||"Student";
  main.innerHTML=`<section class="hero"><div class="row"><div><div class="eyebrow">STUDENT OVERVIEW</div><h1>${esc(name)}</h1><p>Grade ${student.grade_level||"—"} · ${esc(student.target_exam||"PSAT")} · Target ${student.target_score||"—"}</p></div><button class="btn secondary" id="backParent">Back to parent dashboard</button></div></section><section class="grid"><div class="card c3"><div class="label">Lessons complete</div><div class="metric">${summary.completed}</div></div><div class="card c3"><div class="label">Average mastery</div><div class="metric">${summary.avgMastery}%</div></div><div class="card c3"><div class="label">Recent accuracy</div><div class="metric">${summary.attemptCount?summary.accuracy+"%":"—"}</div></div><div class="card c3"><div class="label">Recent questions</div><div class="metric">${summary.attemptCount}</div></div><div class="card c6"><h2>Strengths</h2><p>${summary.strongest?`Current strongest tracked skill: <strong>${esc(summary.strongest.skill_key)}</strong> (${Math.round(Number(summary.strongest.mastery)*100)}% mastery).`:"Strength data will appear after practice begins."}</p></div><div class="card c6"><h2>Needs attention</h2><p>${summary.weakest?`Current lowest tracked skill: <strong>${esc(summary.weakest.skill_key)}</strong> (${Math.round(Number(summary.weakest.mastery)*100)}% mastery).`:"Weakness data will appear after practice begins."}</p></div><div class="card c12"><h2>Next product step</h2><p class="muted">The upcoming diagnostic engine will turn this profile into a recommended learning path and projected readiness view.</p></div></section>`;
  document.querySelector("#backParent")?.addEventListener("click",()=>{main.removeAttribute("id");render();});
}

const observer=new MutationObserver(()=>setTimeout(render,0));observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(render,150);supabase.auth.onAuthStateChange(()=>setTimeout(render,150));
