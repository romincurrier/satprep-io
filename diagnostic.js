import { supabase } from './supabase.js';

const BANK=[
 {id:'m1',domain:'Math',skill:'Linear Equations',d:1,q:'Solve: 4x + 6 = 30',o:['4','5','6','9'],a:2},
 {id:'m2',domain:'Math',skill:'Percent',d:1,q:'A $120 jacket is discounted 30%. What is the sale price?',o:['$36','$72','$84','$90'],a:2},
 {id:'m3',domain:'Math',skill:'Rates',d:1,q:'A runner covers 7.5 miles in 60 minutes at a constant rate. How far in 36 minutes?',o:['3.5 miles','4.5 miles','5 miles','6 miles'],a:1},
 {id:'m4',domain:'Math',skill:'Ratios',d:2,q:'The ratio of red to blue marbles is 5:3. If there are 48 marbles total, how many are blue?',o:['15','18','24','30'],a:1},
 {id:'m5',domain:'Math',skill:'Systems',d:2,q:'If y = 2x + 1 and y = x + 5, what is x?',o:['2','3','4','6'],a:2},
 {id:'m6',domain:'Math',skill:'Functions',d:2,q:'If f(x)=3x²−2, what is f(−2)?',o:['4','10','14','34'],a:1},
 {id:'m7',domain:'Math',skill:'Quadratics',d:3,q:'Which values solve x² − 7x + 12 = 0?',o:['−3 and −4','3 and 4','2 and 6','1 and 12'],a:1},
 {id:'m8',domain:'Math',skill:'Geometry',d:3,q:'A circle has area 49π. What is its circumference?',o:['7π','14π','49π','98π'],a:1},
 {id:'r1',domain:'Reading & Writing',skill:'Inference',d:1,p:'Lena arrived twenty minutes early, reviewed her notes twice, and chose a seat near the front. When the speaker entered, she immediately put her phone away.',q:'Which inference is best supported?',o:['Lena was uninterested in the event.','Lena was prepared and attentive.','Lena had forgotten why she came.','Lena planned to leave early.'],a:1},
 {id:'r2',domain:'Reading & Writing',skill:'Transitions',d:1,q:'The experiment produced an unexpected result. ___, the researchers repeated it with a larger sample.',o:['For example','Nevertheless','Therefore','Similarly'],a:2},
 {id:'r3',domain:'Reading & Writing',skill:'Grammar',d:1,q:'Which sentence is grammatically correct?',o:['The collection of maps are stored upstairs.','The collection of maps is stored upstairs.','The collection of maps were stored upstairs yesterday and is today.','The collection of maps have been stored upstairs.'],a:1},
 {id:'r4',domain:'Reading & Writing',skill:'Evidence',d:2,p:'A school moved its start time from 7:20 a.m. to 8:10 a.m. The following semester, average first-period attendance rose from 91% to 95%, while attendance in later periods changed little.',q:'Which claim is best supported?',o:['Later start times always improve grades.','The schedule change was associated with improved first-period attendance.','Students preferred every aspect of the new schedule.','Later periods became less important.'],a:1},
 {id:'r5',domain:'Reading & Writing',skill:'Words in Context',d:2,q:'In the sentence “The committee adopted a measured response rather than acting immediately,” measured most nearly means:',o:['calculated in units','careful and restrained','very lengthy','unpopular'],a:1},
 {id:'r6',domain:'Reading & Writing',skill:'Rhetorical Synthesis',d:2,q:'A student wants to emphasize a contrast between two studies. Which transition best serves that goal?',o:['Likewise,','For instance,','However,','Consequently,'],a:2},
 {id:'r7',domain:'Reading & Writing',skill:'Punctuation',d:3,q:'Choose the best punctuation: “The telescope revealed three objects ___ a comet, a distant galaxy, and a nebula.”',o:['objects, a comet','objects: a comet','objects; a comet','objects a comet'],a:1},
 {id:'r8',domain:'Reading & Writing',skill:'Analysis',d:3,p:'Researchers observed that urban gardens with a greater variety of flowering plants attracted more bee species. The study did not manipulate plant variety and did not measure bee populations before the gardens were created.',q:'Which statement most accurately evaluates the evidence?',o:['It proves plant variety causes bee diversity.','It supports an association but does not establish causation.','It proves bees cause gardens to contain more plants.','It provides no information about bees.'],a:1}
];

let running=false;
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));

async function context(){const{data:{session}}=await supabase.auth.getSession();if(!session)return{};const{data:p}=await supabase.from('profiles').select('id,role,first_name').eq('id',session.user.id).maybeSingle();if(p?.role!=='student')return{session,profile:p};const{data:s}=await supabase.from('students').select('*').eq('profile_id',p.id).maybeSingle();return{session,profile:p,student:s}}
function top(){return `<div class="top"><div class="logo">SAT<span>prep.io</span></div><div class="navlinks"><button class="linkbtn" id="diagExit">Dashboard</button></div></div>`}

async function startDiagnostic(){
 const {student}=await context();if(!student)return;
 const {data:attempt,error}=await supabase.from('diagnostic_attempts').insert({student_id:student.id}).select('id').single();if(error)return alert(error.message);
 running=true;runQuestion(student,attempt.id,0,[],Date.now());
}
function runQuestion(student,attemptId,index,results,started){
 const q=BANK[index],app=document.querySelector('#app');
 app.innerHTML=top()+`<main class="wrap"><div class="card" style="max-width:820px;margin:auto"><div class="row"><div><div class="eyebrow">INITIAL DIAGNOSTIC</div><h2 style="margin:0">${esc(q.domain)}</h2></div><span class="badge">${index+1} of ${BANK.length}</span></div><div class="progress" style="margin:16px 0 24px"><div style="width:${Math.round(index/BANK.length*100)}%"></div></div>${q.p?`<div class="passage">${esc(q.p)}</div>`:''}<div class="question">${esc(q.q)}</div>${q.o.map((x,i)=>`<button class="option" data-a="${i}"><strong>${String.fromCharCode(65+i)}.</strong> ${esc(x)}</button>`).join('')}<p class="small">Choose the best answer. Your results will determine where SATprep.io begins teaching.</p></div></main>`;
 document.querySelector('#diagExit').onclick=()=>location.assign('/?app=1');
 document.querySelectorAll('[data-a]').forEach(b=>b.onclick=async()=>{
  const selected=Number(b.dataset.a),correct=selected===q.a,response_ms=Date.now()-started;
  await supabase.from('diagnostic_responses').insert({attempt_id:attemptId,student_id:student.id,question_key:q.id,domain:q.domain,skill_key:q.skill,difficulty:q.d,selected_answer:selected,correct_answer:q.a,is_correct:correct,response_ms});
  const next=[...results,{...q,correct}];
  if(index<BANK.length-1)runQuestion(student,attemptId,index+1,next,Date.now());else finish(student,attemptId,next);
 });
}
async function finish(student,attemptId,results){
 const math=results.filter(x=>x.domain==='Math'),rw=results.filter(x=>x.domain!=='Math');
 const score=a=>a.filter(x=>x.correct).length/a.length;
 const mathScore=score(math),rwScore=score(rw),overall=(mathScore+rwScore)/2;
 const bySkill={};results.forEach(x=>{bySkill[x.skill]??={right:0,total:0,domain:x.domain};bySkill[x.skill].total++;if(x.correct)bySkill[x.skill].right++;});
 const ranked=Object.entries(bySkill).map(([skill,v])=>({skill,domain:v.domain,mastery:v.right/v.total})).sort((a,b)=>a.mastery-b.mastery);
 const path={priority_skills:ranked.slice(0,5),strengths:ranked.slice(-3).reverse(),diagnostic_version:'v1'};
 const recommended=overall>=.8?'Accelerated SAT/PSAT Path':overall>=.55?'Core SAT/PSAT Path':'Foundation-Building Path';
 await supabase.from('diagnostic_attempts').update({status:'completed',completed_at:new Date().toISOString(),math_score:mathScore,rw_score:rwScore,overall_score:overall,recommended_start:recommended,summary:path}).eq('id',attemptId);
 await supabase.from('students').update({diagnostic_completed_at:new Date().toISOString(),diagnostic_math_mastery:mathScore,diagnostic_rw_mastery:rwScore,recommended_path:path,onboarding_complete:true}).eq('id',student.id);
 for(const x of ranked)await supabase.from('skill_mastery').upsert({student_id:student.id,skill_key:x.skill,mastery:x.mastery,items_attempted:results.filter(r=>r.skill===x.skill).length,updated_at:new Date().toISOString()},{onConflict:'student_id,skill_key'});
 running=false;renderResults(mathScore,rwScore,recommended,path);
}
function renderResults(math,rw,recommended,path){const app=document.querySelector('#app');app.innerHTML=top()+`<main class="wrap"><section class="hero"><div class="eyebrow">DIAGNOSTIC COMPLETE</div><h1>Your starting path is ready.</h1><p>SATprep.io will use these results to decide what to teach first and what can wait.</p></section><section class="grid"><div class="card c4"><div class="label">Math readiness</div><div class="metric">${Math.round(math*100)}%</div></div><div class="card c4"><div class="label">Reading & Writing readiness</div><div class="metric">${Math.round(rw*100)}%</div></div><div class="card c4"><div class="label">Recommended start</div><div style="font-size:21px;font-weight:850;color:var(--navy);margin-top:8px">${esc(recommended)}</div></div><div class="card c6"><h2>Teach first</h2>${path.priority_skills.map(x=>`<div class="lesson"><div><strong>${esc(x.skill)}</strong><div class="small">${esc(x.domain)}</div></div><span class="badge ${x.mastery>=.8?'good':'warn'}">${Math.round(x.mastery*100)}%</span></div>`).join('')}</div><div class="card c6"><h2>Current strengths</h2>${path.strengths.map(x=>`<div class="lesson"><div><strong>${esc(x.skill)}</strong><div class="small">${esc(x.domain)}</div></div><span class="badge good">${Math.round(x.mastery*100)}%</span></div>`).join('')}</div><div class="card c12"><button class="btn" id="diagContinue">Go to my learning path</button></div></section></main>`;document.querySelector('#diagExit').onclick=document.querySelector('#diagContinue').onclick=()=>location.assign('/?app=1')}

async function enhance(){if(running)return;const params=new URLSearchParams(location.search);if(params.get('app')!=='1'||params.get('openBilling')==='1')return;const{profile,student}=await context();if(profile?.role!=='student'||!student||student.diagnostic_completed_at)return;if(document.querySelector('#startDiagnosticCard'))return;const main=document.querySelector('main');if(!main)return;const card=document.createElement('section');card.id='startDiagnosticCard';card.className='card';card.style.maxWidth='760px';card.style.margin='18px auto';card.innerHTML=`<div class="eyebrow">YOUR FIRST STEP</div><h2>Let's find the right starting point.</h2><p class="muted">This short diagnostic samples Math and Reading & Writing skills. It isn't a grade. SATprep.io uses the results to avoid wasting time on material you already know and to identify what should be taught first.</p><div class="notice"><strong>About 10–15 minutes</strong> · 16 questions · Results immediately shape your learning path.</div><button class="btn" id="startDiagnostic" style="margin-top:14px">Start my diagnostic</button>`;main.prepend(card);document.querySelector('#startDiagnostic').onclick=startDiagnostic}
const obs=new MutationObserver(()=>setTimeout(enhance,0));obs.observe(document.documentElement,{subtree:true,childList:true});setTimeout(enhance,200);
