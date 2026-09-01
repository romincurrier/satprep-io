import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function adminContext(req){const auth=await authenticatedUser(req);if(!auth?.user)return null;const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role&limit=1`),profile=rows?.[0];return profile?.role==='admin'?{...auth,profile}:null}
function pct(v){return Math.round(Number(v||0)*100)}
function phase({enrollment,student,attempt,answered,lessons}){
 if(!enrollment)return'No pilot selected';
 if(enrollment.status==='open')return'Waiting for parent account';
 if(!student)return'Parent account created · waiting for child setup';
 if(!student.profile_id)return'Child created · waiting for student login activation';
 if(!student.onboarding_complete)return'Student login active · learner profile pending';
 if(!student.diagnostic_completed_at){if(attempt)return`Diagnostic in progress · ${answered}/${attempt.summary?.question_plan?.length||20}`;return'Ready for diagnostic';}
 if(!lessons.length)return'Learning path generated · ready for prep';
 return`Prep in progress · ${lessons.filter(x=>x.completed_at).length} lesson session(s) complete`;
}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);const ctx=await adminContext(req);if(!ctx)return json(res,401,{error:'Administrator access is required.'});
  await enforceRateLimit(ctx.user.id,'admin/live-pilot-monitor',{limit:30,windowSeconds:60});
  const enrollments=await service('/rest/v1/pilot_enrollments?select=id,label,status,expires_at,parent_profile_id,household_id,student_id,created_at,claimed_at,completed_at&order=created_at.desc&limit=20');
  const requested=String(req.body?.enrollment_id||'').trim();if(requested&&!UUID.test(requested))return json(res,400,{error:'Pilot selection is invalid.'});
  const enrollment=requested?(enrollments||[]).find(x=>x.id===requested):(enrollments||[])[0];if(!enrollment)return json(res,200,{ok:true,enrollments:[],pilot:null});
  const parentPromise=enrollment.parent_profile_id?service(`/rest/v1/profiles?id=eq.${encodeURIComponent(enrollment.parent_profile_id)}&select=id,first_name,last_name,role,is_test_account&limit=1`):Promise.resolve([]);
  const householdPromise=enrollment.household_id?service(`/rest/v1/households?id=eq.${encodeURIComponent(enrollment.household_id)}&select=id,name,is_test_household,created_at&limit=1`):Promise.resolve([]);
  const pilotLabel=`live-pilot:${enrollment.id}`,studentSelect='id,profile_id,display_name,first_name,last_name,grade_level,target_exam,target_score,onboarding_complete,diagnostic_completed_at,diagnostic_math_mastery,diagnostic_rw_mastery,recommended_path,is_test_student,test_label,created_at';
  const studentPromise=enrollment.student_id?service(`/rest/v1/students?id=eq.${encodeURIComponent(enrollment.student_id)}&is_test_student=eq.true&test_label=eq.${encodeURIComponent(pilotLabel)}&select=${studentSelect}&limit=1`):enrollment.household_id?service(`/rest/v1/students?household_id=eq.${encodeURIComponent(enrollment.household_id)}&is_test_student=eq.true&test_label=eq.${encodeURIComponent(pilotLabel)}&select=${studentSelect}&order=created_at.asc&limit=1`):Promise.resolve([]);
  const [parents,households,students]=await Promise.all([parentPromise,householdPromise,studentPromise]),parent=parents?.[0]||null,household=households?.[0]||null,student=students?.[0]||null;
  let attempts=[],responses=[],lessons=[],skills=[],questions=[],journey=[],achievements=[];
  if(student){[attempts,lessons,skills,questions,journey,achievements]=await Promise.all([
   service(`/rest/v1/diagnostic_attempts?student_id=eq.${encodeURIComponent(student.id)}&select=id,status,started_at,completed_at,math_score,rw_score,overall_score,recommended_start,summary&order=started_at.desc`),
   service(`/rest/v1/lesson_progress?student_id=eq.${encodeURIComponent(student.id)}&select=lesson_key,current_question,best_score,last_score,completed_at,updated_at&order=updated_at.desc`),
   service(`/rest/v1/skill_mastery?student_id=eq.${encodeURIComponent(student.id)}&select=skill_key,mastery,items_attempted,updated_at&order=mastery.asc`),
   service(`/rest/v1/question_attempts?student_id=eq.${encodeURIComponent(student.id)}&select=id,lesson_key,skill_key,is_correct,response_ms,created_at&order=created_at.desc&limit=100`),
   service(`/rest/v1/student_journey?student_id=eq.${encodeURIComponent(student.id)}&select=student_id,xp,level,stage_key,weekly_sessions,weekly_goal,updated_at&limit=1`),
   service(`/rest/v1/student_achievements?student_id=eq.${encodeURIComponent(student.id)}&select=achievement_key,title,description,xp_awarded,earned_at&order=earned_at.desc`)
  ]);const ids=(attempts||[]).map(x=>x.id);if(ids.length)responses=await service(`/rest/v1/diagnostic_responses?student_id=eq.${encodeURIComponent(student.id)}&select=id,attempt_id,skill_key,difficulty,is_correct,response_ms,created_at&order=created_at.asc`);}
  const attempt=(attempts||[])[0]||null,answered=attempt?(responses||[]).filter(r=>r.attempt_id===attempt.id).length:0,mastery=(skills||[]).map(x=>Number(x.mastery||0)),avgMastery=mastery.length?mastery.reduce((a,b)=>a+b,0)/mastery.length:0,recentQuestions=(questions||[]),accuracy=recentQuestions.length?recentQuestions.filter(x=>x.is_correct===true).length/recentQuestions.length:null,path=student?.recommended_path||{},priority=path.priority_skills||path.diagnostic_priority_skills||path.diagnostic?.priority_skills||[];
  const timeline=[
   {at:enrollment.created_at,label:'Pilot invitation created'},
   enrollment.claimed_at&&{at:enrollment.claimed_at,label:'Parent account enrolled in live pilot'},
   student?.created_at&&{at:student.created_at,label:'Child record created'},
   student?.profile_id&&{at:student.created_at,label:'Student login activated'},
   attempt?.started_at&&{at:attempt.started_at,label:'Diagnostic started'},
   attempt?.completed_at&&{at:attempt.completed_at,label:'Diagnostic completed'},
   ...(lessons||[]).filter(x=>x.completed_at).map(x=>({at:x.completed_at,label:`Lesson completed: ${x.lesson_key}`})),
   ...(achievements||[]).map(x=>({at:x.earned_at,label:`Achievement: ${x.title}`}))
  ].filter(Boolean).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,25);
  return json(res,200,{ok:true,enrollments:(enrollments||[]).map(x=>({id:x.id,label:x.label,status:x.status,created_at:x.created_at,claimed_at:x.claimed_at})),pilot:{enrollment,parent:parent?{id:parent.id,name:[parent.first_name,parent.last_name].filter(Boolean).join(' ')||'Pilot parent',is_test_account:!!parent.is_test_account}:null,household,student:student?{id:student.id,name:student.display_name||[student.first_name,student.last_name].filter(Boolean).join(' ')||'Pilot student',grade_level:student.grade_level,target_exam:student.target_exam,target_score:student.target_score,login_active:!!student.profile_id,onboarding_complete:!!student.onboarding_complete,diagnostic_completed_at:student.diagnostic_completed_at,is_test_student:!!student.is_test_student}:null,phase:phase({enrollment,student,attempt,answered,lessons:lessons||[]}),diagnostic:attempt?{id:attempt.id,status:attempt.status,answered,total:attempt.summary?.question_plan?.length||20,math:pct(attempt.math_score),rw:pct(attempt.rw_score),overall:pct(attempt.overall_score),recommended_start:attempt.recommended_start,started_at:attempt.started_at,completed_at:attempt.completed_at}:null,learning:{avg_mastery:pct(avgMastery),mastered_skills:(skills||[]).filter(x=>Number(x.mastery)>=.8).length,skills:(skills||[]).slice(0,12),priority_skills:priority.slice(0,8),lessons_completed:(lessons||[]).filter(x=>x.completed_at).length,lessons:(lessons||[]).slice(0,12),recent_questions:recentQuestions.length,recent_accuracy:accuracy===null?null:pct(accuracy)},journey:journey?.[0]||null,achievements:(achievements||[]).slice(0,12),timeline}});
 }catch(error){console.error('live-pilot-monitor',error?.message||error);if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));const status=Number(error.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?error.message:'Unable to load live pilot monitoring right now.'})}
}
