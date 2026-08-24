import { supabase } from './supabase.js';

const CANON={
  'Vocabulary':'Words in Context','Precision':'Words in Context','Reading Comprehension':'Reading Comprehension','Reading & Writing':'Reading & Writing','Evidence':'Evidence','Inference':'Inference','Analysis':'Analysis',
  'Writing Mechanics':'Grammar','Writing Concepts':'Rhetorical Synthesis','Organization':'Rhetorical Synthesis','Purpose':'Rhetorical Synthesis','Style':'Rhetorical Synthesis',
  'Math':'Math','Number Sense':'Number Sense','Fractions & Decimals':'Fractions & Decimals','Geometry':'Geometry','Measurement':'Geometry','Data Analysis':'Data Analysis',
  'Pre-Algebra':'Linear Equations','Math Concepts':'Math','Math Procedures':'Math','Problem Solving':'Problem Solving'
};
function key(s){return CANON[s]||s}
function add(map,skill,mastery,weight,source){if(mastery==null||!Number.isFinite(Number(mastery)))return;const k=key(skill),m=Math.max(0,Math.min(1,Number(mastery)));map[k]??={weighted:0,weight:0,sources:[]};map[k].weighted+=m*weight;map[k].weight+=weight;map[k].sources.push({source,mastery:m,weight})}
function normalizeSection(sourceType,skill,value){const v=Number(value);if(!Number.isFinite(v))return null;const s=String(sourceType||'').toUpperCase();if(s==='SAT')return Math.max(0,Math.min(1,(v-200)/600));if(s.startsWith('PSAT'))return Math.max(0,Math.min(1,(v-160)/600));if(s==='ACT'||s==='PREACT')return Math.max(0,Math.min(1,(v-1)/35));return null}
async function compose(){const p=new URLSearchParams(location.search);if(p.get('app')!=='1')return;const{data:{session}}=await supabase.auth.getSession();if(!session)return;const{data:profile}=await supabase.from('profiles').select('id,role').eq('id',session.user.id).maybeSingle();if(profile?.role!=='student')return;const{data:student}=await supabase.from('students').select('*').eq('profile_id',profile.id).maybeSingle();if(!student)return;
 const [{data:evidence},{data:attempts},{data:mastery}]=await Promise.all([
  supabase.from('student_skill_evidence').select('canonical_skill,score_kind,score_value,reliability,source_type,observed_at').eq('student_id',student.id),
  supabase.from('diagnostic_attempts').select('summary,completed_at').eq('student_id',student.id).eq('status','completed').order('completed_at',{ascending:false}).limit(1),
  supabase.from('skill_mastery').select('skill_key,mastery,items_attempted,updated_at').eq('student_id',student.id)
 ]);
 const map={};
 for(const e of evidence||[]){
  if(e.score_kind==='content_mastery')add(map,e.canonical_skill,Number(e.score_value)/100,Math.max(.5,Number(e.reliability||1)),'prior_assessment');
  else if(e.score_kind==='percentile')add(map,e.canonical_skill,Number(e.score_value)/100,.2*Math.max(.5,Number(e.reliability||1)),'norm_percentile');
  else if(e.score_kind==='section_score'){const normalized=normalizeSection(e.source_type,e.canonical_skill,e.score_value);if(normalized!=null)add(map,e.canonical_skill,normalized,.45*Math.max(.5,Number(e.reliability||1)),'standardized_section_score')}
 }
 const diag=attempts?.[0]?.summary;for(const x of diag?.priority_skills||[])add(map,x.skill,x.mastery,1.5,'diagnostic');for(const x of diag?.strengths||[])add(map,x.skill,x.mastery,1.5,'diagnostic');
 for(const x of mastery||[]){const attempts=Math.max(1,Number(x.items_attempted||1)),w=Math.min(3,.75+attempts*.25);add(map,x.skill_key,x.mastery,w,'lesson_performance')}
 const combined=Object.entries(map).map(([skill,v])=>({skill,mastery:v.weight?v.weighted/v.weight:0,evidence_count:v.sources.length,sources:v.sources})).sort((a,b)=>a.mastery-b.mastery);
 if(!combined.length)return;const current=student.recommended_path&&typeof student.recommended_path==='object'?student.recommended_path:{};const priority_skills=combined.slice(0,8).map(x=>({skill:x.skill,mastery:x.mastery,evidence_count:x.evidence_count})),strengths=[...combined].sort((a,b)=>b.mastery-a.mastery).slice(0,5).map(x=>({skill:x.skill,mastery:x.mastery,evidence_count:x.evidence_count}));const learning_model={version:'evidence-1.1',updated_at:new Date().toISOString(),skills:combined};
 const next={...current,priority_skills,strengths,learning_model};await supabase.from('students').update({recommended_path:next}).eq('id',student.id)
}
let busy=false;async function schedule(){if(busy)return;busy=true;try{await compose()}finally{busy=false}}setTimeout(schedule,700);supabase.auth.onAuthStateChange(()=>setTimeout(schedule,500));
