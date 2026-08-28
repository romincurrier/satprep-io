import {createHash, randomBytes} from 'node:crypto';
import {QUESTION_BANK, eligibleQuestions} from '../question-bank-production.js';
import {STAGED_PRACTICE_BANK} from '../practice-bank-v2.js';
import {SKILL_INDEX, skillEligibleForExam} from '../sat-spec.js';
import {service} from './supabase-server.js';

export const PILOT_AGENT_VERSION='pilot-agent-v1';

export const PILOT_PERSONAS=Object.freeze({
  balanced_middle:{label:'Balanced middle',grade:10,targetExam:'SAT',targetScore:1250,rw:.64,math:.64},
  math_strong_rw_weak:{label:'Math strong / R&W developing',grade:11,targetExam:'SAT',targetScore:1350,rw:.46,math:.88},
  rw_strong_math_weak:{label:'R&W strong / Math developing',grade:10,targetExam:'PSAT/NMSQT',targetScore:1250,rw:.88,math:.46},
  foundation:{label:'Foundation learner',grade:9,targetExam:'PSAT/NMSQT',targetScore:1100,rw:.40,math:.38},
  advanced:{label:'Advanced learner',grade:11,targetExam:'SAT',targetScore:1500,rw:.91,math:.91}
});

const clamp=x=>Math.max(.08,Math.min(.97,x));
const digestNumber=value=>parseInt(createHash('sha256').update(String(value)).digest('hex').slice(0,8),16)/0xffffffff;
const timestamp=()=>new Date().toISOString();
const pilotEmail=(role,token)=>`satprep-pilot-${role}-${token}@example.com`;
const password=()=>`P!lot-${randomBytes(18).toString('base64url')}9a`;

function probability(persona,item,phase,index){
  const sectionBase=item.section==='MATH'?persona.math:persona.rw;
  const difficultyPenalty=(Number(item.difficulty||2)-2)*.10;
  const phaseBoost=phase==='practice'?.05:0;
  const fatigue=index>=14?-.04:0;
  return clamp(sectionBase-difficultyPenalty+phaseBoost+fatigue);
}
function answersCorrect(persona,item,phase,index,seed){return digestNumber(`${seed}|${phase}|${item.id}|${index}`)<probability(persona,item,phase,index)}
function selectedAnswer(item,correct,seed,index){if(correct)return item.answerIndex;const offset=1+(Math.floor(digestNumber(`${seed}|wrong|${item.id}|${index}`)*3)%3);return (item.answerIndex+offset)%4}
function examEligible(item,exam){return (!item.exams||item.exams.includes(exam))&&skillEligibleForExam(item.skill,exam)}

function diagnosticPlan(exam){
  const bank=eligibleQuestions(exam).filter(q=>q.format==='mcq'&&Array.isArray(q.choices)&&Number.isInteger(q.answerIndex));
  const choose=section=>{
    const rows=bank.filter(q=>q.section===section),out=[],seen=new Set();
    for(const q of rows){if(!seen.has(q.skill)){out.push(q);seen.add(q.skill)}if(out.length===10)break}
    if(out.length<10)for(const q of rows){if(!out.includes(q))out.push(q);if(out.length===10)break}
    return out;
  };
  return [...choose('RW'),...choose('MATH')];
}
function weakestSkills(skillRows,exam,count=2){
  return [...skillRows].filter(x=>skillEligibleForExam(x.skill_key,exam)).sort((a,b)=>Number(a.mastery)-Number(b.mastery)).slice(0,count).map(x=>x.skill_key);
}
function practicePlan(skill,exam,length=5){return STAGED_PRACTICE_BANK.filter(q=>q.skill===skill&&examEligible(q,exam)&&Array.isArray(q.choices)&&Number.isInteger(q.answerIndex)).slice(0,length)}

async function event(runId,type,key,payload={}){await service('/rest/v1/test_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({test_run_id:runId,event_type:type,event_key:key,payload:{pilot_agent_version:PILOT_AGENT_VERSION,...payload}})})}
async function patch(path,body){return service(path,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(body)})}
async function insert(path,body,{representation=false}={}){return service(path,{method:'POST',headers:{Prefer:representation?'return=representation':'return=minimal'},body:JSON.stringify(body)})}

async function createAuthUser({email,passwordValue,role,firstName,lastName,parentAuthorized=false}){
  return service('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,password:passwordValue,email_confirm:true,user_metadata:{role,first_name:firstName,last_name:lastName,...(role==='student'?{date_of_birth:'2010-01-15'}:{})},app_metadata:{satprep_test_account:true,account_origin:'pilot_agent',...(parentAuthorized?{satprep_parent_authorized:true}:{})}})});
}
async function verifyPasswordSignIn(email,passwordValue){
  const result=await service('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password:passwordValue})});
  return !!result?.access_token&&!!result?.user?.id;
}

export async function createPilotFamily(adminProfileId,personaKey){
  const persona=PILOT_PERSONAS[personaKey];if(!persona)throw Object.assign(new Error('Unknown pilot persona.'),{status:400});
  const token=randomBytes(6).toString('hex'),parentEmail=pilotEmail('parent',token),studentEmail=pilotEmail('student',token),parentPassword=password(),studentPassword=password();
  let parentUser=null,studentUser=null,householdId=null;
  try{
    parentUser=await createAuthUser({email:parentEmail,passwordValue:parentPassword,role:'parent',firstName:'Pilot',lastName:`Parent ${token.slice(0,4)}`});
    const parentRows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(parentUser.id)}&select=id,household_id,billing_owner`),parent=parentRows?.[0];
    if(!parent?.household_id)throw new Error('Pilot parent household was not created.');householdId=parent.household_id;
    await patch(`/rest/v1/profiles?id=eq.${encodeURIComponent(parent.id)}`,{is_test_account:true});
    await patch(`/rest/v1/households?id=eq.${encodeURIComponent(householdId)}`,{name:`Pilot ${persona.label} ${token.slice(0,4)}`,is_test_household:true,student_limit:3});

    studentUser=await createAuthUser({email:studentEmail,passwordValue:studentPassword,role:'student',firstName:'Pilot',lastName:`Student ${token.slice(0,4)}`,parentAuthorized:true});
    await patch(`/rest/v1/profiles?id=eq.${encodeURIComponent(studentUser.id)}`,{is_test_account:true,household_id:householdId,date_of_birth:'2010-01-15'});
    const studentRows=await service(`/rest/v1/students?profile_id=eq.${encodeURIComponent(studentUser.id)}&select=id&limit=1`),student=studentRows?.[0];
    if(!student?.id)throw new Error('Pilot student record was not created.');
    await patch(`/rest/v1/students?id=eq.${encodeURIComponent(student.id)}`,{household_id:householdId,is_test_student:true,test_label:`${PILOT_AGENT_VERSION}:${personaKey}`,first_name:'Pilot',last_name:`Student ${token.slice(0,4)}`,display_name:`Pilot Student ${token.slice(0,4)}`,date_of_birth:'2010-01-15',grade_level:persona.grade,math_course:persona.math>.75?'Algebra II':'Algebra I',target_exam:persona.targetExam,target_score:persona.targetScore,onboarding_complete:true});
    await insert('/rest/v1/parent_students?on_conflict=parent_profile_id,student_id',{parent_profile_id:parent.id,student_id:student.id});

    const runs=await insert('/rest/v1/test_runs',{tester_profile_id:adminProfileId,test_student_id:student.id,run_type:'full_journey',label:`${PILOT_AGENT_VERSION} · ${persona.label}`},{representation:true}),run=runs?.[0];
    if(!run?.id)throw new Error('Pilot test run could not be created.');
    const parentSignIn=await verifyPasswordSignIn(parentEmail,parentPassword),studentSignIn=await verifyPasswordSignIn(studentEmail,studentPassword);
    await event(run.id,'pilot_family_created',personaKey,{household_id:householdId,parent_profile_id:parent.id,student_id:student.id,parent_auth_verified:parentSignIn,student_auth_verified:studentSignIn,target_exam:persona.targetExam,target_score:persona.targetScore});
    return{run,persona,parent:{profile_id:parent.id,email:parentEmail,auth_verified:parentSignIn},student:{id:student.id,profile_id:studentUser.id,email:studentEmail,auth_verified:studentSignIn},household_id:householdId,seed:token};
  }catch(error){
    if(studentUser?.id)await service(`/auth/v1/admin/users/${encodeURIComponent(studentUser.id)}`,{method:'DELETE'}).catch(()=>{});
    if(parentUser?.id)await service(`/auth/v1/admin/users/${encodeURIComponent(parentUser.id)}`,{method:'DELETE'}).catch(()=>{});
    if(householdId)await service(`/rest/v1/households?id=eq.${encodeURIComponent(householdId)}`,{method:'DELETE'}).catch(()=>{});
    throw error;
  }
}

export async function runPilotDiagnostic(family){
  const {run,student,persona,seed}=family,plan=diagnosticPlan(persona.targetExam);if(plan.length<20)throw new Error('Pilot diagnostic fixture bank is not deep enough.');
  const attempts=await insert('/rest/v1/diagnostic_attempts',{student_id:student.id,status:'in_progress',summary:{engine:PILOT_AGENT_VERSION,test_only:true,persona:persona.label,question_plan:plan.map(q=>q.id)}},{representation:true}),attempt=attempts?.[0];if(!attempt?.id)throw new Error('Pilot diagnostic attempt could not be created.');
  const bySkill=new Map(),sections={RW:{right:0,total:0},MATH:{right:0,total:0}};
  for(let index=0;index<plan.length;index++){
    const q=plan[index],correct=answersCorrect(persona,q,'diagnostic',index,seed),selected=selectedAnswer(q,correct,seed,index),responseMs=35000+Math.floor(digestNumber(`${seed}|time|${q.id}`)*65000);
    await insert('/rest/v1/diagnostic_responses',{attempt_id:attempt.id,student_id:student.id,question_key:q.id,domain:q.domain,skill_key:q.skill,difficulty:q.difficulty,selected_answer:selected,correct_answer:q.answerIndex,is_correct:correct,response_ms:responseMs,scored_by_server:true});
    sections[q.section].total++;if(correct)sections[q.section].right++;const s=bySkill.get(q.skill)||{right:0,total:0,domain:q.domain,section:q.section};s.total++;if(correct)s.right++;bySkill.set(q.skill,s);
  }
  const skillRows=[...bySkill].map(([skill,v])=>({skill_key:skill,mastery:v.total?v.right/v.total:0,items_attempted:v.total,domain:v.domain,section:v.section}));
  for(const row of skillRows)await insert('/rest/v1/skill_mastery?on_conflict=student_id,skill_key',{student_id:student.id,skill_key:row.skill_key,mastery:row.mastery,items_attempted:row.items_attempted,updated_at:timestamp()});
  const rw=sections.RW.right/sections.RW.total,math=sections.MATH.right/sections.MATH.total,overall=(rw+math)/2,priority=[...skillRows].sort((a,b)=>a.mastery-b.mastery).slice(0,6).map(x=>({skill:x.skill_key,mastery:x.mastery,source:'pilot diagnostic'})),strengths=[...skillRows].sort((a,b)=>b.mastery-a.mastery).slice(0,4).map(x=>({skill:x.skill_key,mastery:x.mastery,source:'pilot diagnostic'})),completed=timestamp(),recommended=overall>=.8?'Accelerated SAT/PSAT Path':overall>=.55?'Core SAT/PSAT Path':'Foundation-Building Path';
  await patch(`/rest/v1/diagnostic_attempts?id=eq.${encodeURIComponent(attempt.id)}`,{status:'completed',completed_at:completed,math_score:math,rw_score:rw,overall_score:overall,recommended_start:recommended,summary:{engine:PILOT_AGENT_VERSION,test_only:true,persona:persona.label,question_plan:plan.map(q=>q.id),priority_skills:priority,strengths}});
  await patch(`/rest/v1/students?id=eq.${encodeURIComponent(student.id)}`,{diagnostic_completed_at:completed,diagnostic_math_mastery:math,diagnostic_rw_mastery:rw,recommended_path:{priority_skills:priority,strengths,diagnostic_version:PILOT_AGENT_VERSION,test_only:true,recommended_start:recommended}});
  await event(run.id,'pilot_diagnostic_completed','diagnostic',{attempt_id:attempt.id,total:plan.length,rw_mastery:rw,math_mastery:math,overall,priority_skills:priority.map(x=>x.skill)});
  return{attempt_id:attempt.id,total:plan.length,rw,math,overall,skillRows,priority};
}

export async function runPilotPractice(family,diagnostic){
  const {run,student,persona,seed}=family,skills=weakestSkills(diagnostic.skillRows,persona.targetExam,2),sessions=[];
  for(const skill of skills){
    const plan=practicePlan(skill,persona.targetExam,5);if(!plan.length)continue;
    const existing=diagnostic.skillRows.find(x=>x.skill_key===skill)||{mastery:0,items_attempted:0};let right=0;
    for(let index=0;index<plan.length;index++){
      const q=plan[index],correct=answersCorrect(persona,q,'practice',index,seed),selected=selectedAnswer(q,correct,seed,index);if(correct)right++;
      await insert('/rest/v1/question_attempts',{student_id:student.id,lesson_key:`pilot-${skill}`,question_index:index,skill_key:skill,selected_answer:selected,correct_answer:q.answerIndex,is_correct:correct,response_ms:25000+Math.floor(digestNumber(`${seed}|practice-time|${q.id}`)*55000)});
    }
    const oldN=Number(existing.items_attempted||0),newN=oldN+plan.length,newMastery=((Number(existing.mastery||0)*oldN)+right)/Math.max(1,newN),now=timestamp();
    await insert('/rest/v1/skill_mastery?on_conflict=student_id,skill_key',{student_id:student.id,skill_key:skill,mastery:newMastery,items_attempted:newN,updated_at:now});
    await insert('/rest/v1/lesson_progress?on_conflict=student_id,lesson_key',{student_id:student.id,lesson_key:`pilot-${skill}`,current_question:0,best_score:right/plan.length,last_score:right/plan.length,completed_at:now,updated_at:now});
    const result={skill,questions:plan.length,correct:right,score:right/plan.length,mastery_before:Number(existing.mastery||0),mastery_after:newMastery};sessions.push(result);await event(run.id,'pilot_practice_completed',skill,result);
  }
  await patch(`/rest/v1/test_runs?id=eq.${encodeURIComponent(run.id)}`,{status:'completed',completed_at:timestamp(),notes:`${PILOT_AGENT_VERSION} completed diagnostic plus ${sessions.length} targeted practice session(s).`});
  return sessions;
}

export async function runPilotAgent(adminProfileId,personaKey){const family=await createPilotFamily(adminProfileId,personaKey);const diagnostic=await runPilotDiagnostic(family);const practice=await runPilotPractice(family,diagnostic);return{version:PILOT_AGENT_VERSION,run_id:family.run.id,persona:personaKey,persona_label:family.persona.label,household_id:family.household_id,parent:family.parent,student:family.student,diagnostic:{total:diagnostic.total,rw_mastery:diagnostic.rw,math_mastery:diagnostic.math,overall:diagnostic.overall,priority_skills:diagnostic.priority.map(x=>x.skill)},practice}}
