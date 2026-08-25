import {service} from './supabase-server.js';

const CANON={
  Vocabulary:'Words in Context',Precision:'Words in Context','Reading Comprehension':'Reading Comprehension','Reading & Writing':'Reading & Writing',Evidence:'Evidence',Inference:'Inference',Analysis:'Analysis',
  'Writing Mechanics':'Grammar','Writing Concepts':'Rhetorical Synthesis',Organization:'Rhetorical Synthesis',Purpose:'Rhetorical Synthesis',Style:'Rhetorical Synthesis',
  Math:'Math','Number Sense':'Number Sense','Fractions & Decimals':'Fractions & Decimals',Geometry:'Geometry',Measurement:'Geometry','Data Analysis':'Data Analysis',
  'Pre-Algebra':'Linear Equations','Math Concepts':'Math','Math Procedures':'Math','Problem Solving':'Problem Solving'
};

function key(skill){return CANON[skill]||skill}
function add(map,skill,mastery,weight,source){
  if(mastery==null||!Number.isFinite(Number(mastery)))return;
  const k=key(skill),m=Math.max(0,Math.min(1,Number(mastery)));
  map[k]??={weighted:0,weight:0,sources:[]};
  map[k].weighted+=m*weight;map[k].weight+=weight;map[k].sources.push({source,mastery:m,weight});
}
function normalizeSection(sourceType,value){
  const v=Number(value);if(!Number.isFinite(v))return null;
  const s=String(sourceType||'').toUpperCase();
  if(s==='SAT')return Math.max(0,Math.min(1,(v-200)/600));
  if(s.startsWith('PSAT'))return Math.max(0,Math.min(1,(v-160)/600));
  if(s==='ACT'||s==='PREACT')return Math.max(0,Math.min(1,(v-1)/35));
  return null;
}

export async function rebuildLearningModel(student){
  if(!student?.id)throw Object.assign(new Error('Student context is required.'),{status:400});
  const id=encodeURIComponent(student.id);
  const [evidence,attempts,mastery]=await Promise.all([
    service(`/rest/v1/student_skill_evidence?student_id=eq.${id}&select=canonical_skill,score_kind,score_value,reliability,source_type,observed_at`),
    service(`/rest/v1/diagnostic_attempts?student_id=eq.${id}&status=eq.completed&select=summary,completed_at&order=completed_at.desc&limit=1`),
    service(`/rest/v1/skill_mastery?student_id=eq.${id}&select=skill_key,mastery,items_attempted,updated_at`)
  ]);
  const map={};
  for(const e of evidence||[]){
    const reliability=Math.max(.5,Number(e.reliability||1));
    if(e.score_kind==='content_mastery')add(map,e.canonical_skill,Number(e.score_value)/100,reliability,'prior_assessment');
    else if(e.score_kind==='percentile')add(map,e.canonical_skill,Number(e.score_value)/100,.2*reliability,'norm_percentile');
    else if(e.score_kind==='section_score'){const normalized=normalizeSection(e.source_type,e.score_value);if(normalized!=null)add(map,e.canonical_skill,normalized,.45*reliability,'standardized_section_score')}
  }
  const diag=attempts?.[0]?.summary;
  for(const x of diag?.priority_skills||[])add(map,x.skill,x.mastery,1.5,'diagnostic');
  for(const x of diag?.strengths||[])add(map,x.skill,x.mastery,1.5,'diagnostic');
  for(const x of mastery||[]){const attemptsCount=Math.max(1,Number(x.items_attempted||1)),weight=Math.min(3,.75+attemptsCount*.25);add(map,x.skill_key,x.mastery,weight,'lesson_performance')}
  const combined=Object.entries(map).map(([skill,v])=>({skill,mastery:v.weight?v.weighted/v.weight:0,evidence_count:v.sources.length,sources:v.sources})).sort((a,b)=>a.mastery-b.mastery);
  if(!combined.length)return{updated:false,priority_skills:[],strengths:[]};
  const current=student.recommended_path&&typeof student.recommended_path==='object'?student.recommended_path:{};
  const priority_skills=combined.slice(0,8).map(x=>({skill:x.skill,mastery:x.mastery,evidence_count:x.evidence_count}));
  const strengths=[...combined].sort((a,b)=>b.mastery-a.mastery).slice(0,5).map(x=>({skill:x.skill,mastery:x.mastery,evidence_count:x.evidence_count}));
  const learning_model={version:'evidence-1.2-server',updated_at:new Date().toISOString(),skills:combined};
  const next={...current,priority_skills,strengths,learning_model};
  await service(`/rest/v1/students?id=eq.${id}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({recommended_path:next})});
  return{updated:true,priority_skills,strengths,model_version:learning_model.version};
}
