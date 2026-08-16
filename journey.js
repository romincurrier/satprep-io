import { supabase } from './supabase.js';
const STAGES=[
 {key:'base_camp',icon:'🏁',name:'Base Camp',need:0,desc:'Set your goals and discover your starting point.'},
 {key:'skill_scout',icon:'🔎',name:'Skill Scout',need:250,desc:'Find the skills that will make the biggest difference.'},
 {key:'foundation_builder',icon:'🧱',name:'Foundation Builder',need:650,desc:'Turn weak spots into reliable skills.'},
 {key:'momentum',icon:'⚡',name:'Momentum',need:1200,desc:'Build consistency, accuracy and confidence.'},
 {key:'strategy_master',icon:'🧠',name:'Strategy Master',need:2000,desc:'Apply strong skills under SAT/PSAT conditions.'},
 {key:'target_zone',icon:'🎯',name:'Target Zone',need:3000,desc:'Close the final gaps between you and your goal.'},
 {key:'test_ready',icon:'🏆',name:'Test Ready',need:4200,desc:'Demonstrate the readiness to attack test day.'}
];
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
let drawing=false;
async function ctx(){const{data:{session}}=await supabase.auth.getSession();if(!session)return{};const{data:p}=await supabase.from('profiles').select('id,role,first_name').eq('id',session.user.id).maybeSingle();if(p?.role!=='student')return{profile:p};const{data:s}=await supabase.from('students').select('*').eq('profile_id',p.id).maybeSingle();return{profile:p,student:s}}
async function compute(student){
 const [{data:prog},{data:skills},{data:diag},{data:journey},{data:ach}]=await Promise.all([
  supabase.from('lesson_progress').select('lesson_key,best_score,completed_at').eq('student_id',student.id),
  supabase.from('skill_mastery').select('skill_key,mastery').eq('student_id',student.id),
  supabase.from('diagnostic_attempts').select('status').eq('student_id',student.id).eq('status','completed').limit(1),
  supabase.from('student_journey').select('*').eq('student_id',student.id).maybeSingle(),
  supabase.from('student_achievements').select('*').eq('student_id',student.id).order('earned_at',{ascending:false})
 ]);
 const completed=(prog||[]).filter(x=>x.completed_at).length,mastered=(skills||[]).filter(x=>Number(x.mastery)>=.8).length,diagnostic=!!diag?.length;
 let xp=(diagnostic?150:0)+(completed*75)+(mastered*100);
 const stage=[...STAGES].reverse().find(x=>xp>=x.need)||STAGES[0],level=Math.floor(xp/300)+1;
 if(!journey) await supabase.from('student_journey').insert({student_id:student.id,xp,level,stage_key:stage.key});
 else if(journey.xp!==xp||journey.level!==level||journey.stage_key!==stage.key) await supabase.from('student_journey').update({xp,level,stage_key:stage.key,updated_at:new Date().toISOString()}).eq('student_id',student.id);
 const candidates=[
  {key:'diagnostic',title:'Discover Your Starting Point',desc:'Complete your initial diagnostic.',done:diagnostic,current:diagnostic?1:0,target:1,reward:150},
  {key:'first_mastery',title:'Master Your First Skill',desc:'Reach 80% mastery in your first skill.',done:mastered>=1,current:Math.min(mastered,1),target:1,reward:100},
  {key:'three_skills',title:'Skill Collector',desc:'Master 3 different skills.',done:mastered>=3,current:Math.min(mastered,3),target:3,reward:200},
  {key:'five_lessons',title:'Build Momentum',desc:'Complete 5 learning sessions.',done:completed>=5,current:Math.min(completed,5),target:5,reward:250},
  {key:'ten_skills',title:'Mastermind',desc:'Master 10 skills.',done:mastered>=10,current:Math.min(mastered,10),target:10,reward:400}
 ];
 const next=candidates.find(x=>!x.done)||{key:'target',title:'Keep Climbing',desc:'Continue strengthening your personalized learning path.',current:completed,target:completed+3,reward:300};
 return {xp,level,stage,completed,mastered,diagnostic,ach:ach||[],next};
}
function pathHTML(state){const current=STAGES.findIndex(x=>x.key===state.stage.key);return `<div class="journey-path">${STAGES.map((s,i)=>`<div class="journey-stop ${i<current?'journey-done':i===current?'journey-current':''}"><div class="journey-node">${s.icon}</div><div><strong>${esc(s.name)}</strong><span>${i===current?'YOU ARE HERE':i<current?'Complete':`${Math.max(0,s.need-state.xp)} XP away`}</span></div></div>`).join('')}</div>`}
async function renderJourney(){if(drawing)return;drawing=true;const{profile,student}=await ctx();if(profile?.role!=='student'||!student){drawing=false;return}const state=await compute(student),app=document.querySelector('#app'),nextStage=STAGES[STAGES.indexOf(state.stage)+1],pct=nextStage?Math.min(100,Math.round((state.xp-state.stage.need)/(nextStage.need-state.stage.need)*100)):100;
 app.innerHTML=`<div class="top"><div class="logo">SAT<span>prep.io</span></div><div class="navlinks"><button class="linkbtn" id="journeyDash">Dashboard</button></div></div><main class="wrap"><section class="hero"><div class="eyebrow">ROAD TO TEST DAY</div><h1>${esc(profile.first_name)}'s Journey</h1><p>Every lesson, mastered skill and milestone moves you closer to being test ready.</p></section><section class="grid"><div class="card c8"><div class="row"><div><div class="label">CURRENT STAGE</div><h2>${state.stage.icon} ${esc(state.stage.name)}</h2><p class="muted">${esc(state.stage.desc)}</p></div><div style="text-align:right"><div class="label">LEVEL ${state.level}</div><div class="metric">${state.xp} XP</div></div></div><div class="progress"><div style="width:${pct}%"></div></div><div class="small" style="margin-top:7px">${nextStage?`${nextStage.need-state.xp} XP to ${nextStage.name}`:'You reached Test Ready!'}</div></div><div class="card c4"><div class="label">NEXT MILESTONE</div><h2>🎯 ${esc(state.next.title)}</h2><p>${esc(state.next.desc)}</p><div class="progress"><div style="width:${Math.min(100,Math.round(state.next.current/state.next.target*100))}%"></div></div><div class="row" style="margin-top:9px"><span class="small">${state.next.current} / ${state.next.target}</span><strong>+${state.next.reward} XP</strong></div><button class="btn" id="missionGo" style="width:100%;margin-top:15px">Continue my mission</button></div><div class="card c12"><h2>Your Road to Test Day</h2>${pathHTML(state)}</div><div class="card c6"><h2>Progress that counts</h2><div class="lesson"><span>Lessons completed</span><strong>${state.completed}</strong></div><div class="lesson"><span>Skills mastered</span><strong>${state.mastered}</strong></div><div class="lesson"><span>Diagnostic</span><strong>${state.diagnostic?'✓ Complete':'Next up'}</strong></div></div><div class="card c6"><h2>Achievements</h2>${state.ach.length?state.ach.slice(0,5).map(a=>`<div class="lesson"><div><strong>🏅 ${esc(a.title)}</strong><div class="small">${esc(a.description||'')}</div></div><span class="badge good">+${a.xp_awarded} XP</span></div>`).join(''):`<p class="muted">Your first achievement is waiting. Complete the diagnostic to begin.</p>`}</div></section></main>`;
 document.querySelector('#journeyDash').onclick=document.querySelector('#missionGo').onclick=()=>location.assign('/?app=1');drawing=false;
}
async function inject(){const params=new URLSearchParams(location.search);if(params.get('app')!=='1'||params.get('openBilling')==='1')return;const{profile,student}=await ctx();if(profile?.role!=='student'||!student)return;const nav=document.querySelector('.navlinks');if(nav&&!document.querySelector('#journeyBtn')){const b=document.createElement('button');b.id='journeyBtn';b.className='linkbtn';b.textContent='My Journey';b.onclick=renderJourney;nav.prepend(b)}const hero=document.querySelector('.hero');if(hero&&!document.querySelector('#journeyMini')){const state=await compute(student);const card=document.createElement('div');card.id='journeyMini';card.className='card';card.style.margin='14px 0';card.innerHTML=`<div class="row"><div><div class="label">ROAD TO TEST DAY</div><strong>${state.stage.icon} ${esc(state.stage.name)} · Level ${state.level}</strong><div class="small">Next: ${esc(state.next.title)}</div></div><div class="right"><span class="badge good">${state.xp} XP</span><button class="btn secondary" id="openJourney">View journey</button></div></div>`;hero.insertAdjacentElement('afterend',card);card.querySelector('#openJourney').onclick=renderJourney}}
const o=new MutationObserver(()=>setTimeout(inject,0));o.observe(document.documentElement,{subtree:true,childList:true});setTimeout(inject,250);
