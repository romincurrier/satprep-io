import {authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';
import {PILOT_AGENT_VERSION,PILOT_PERSONAS} from '../server/pilot-agent-core.js';

async function adminContext(req){const auth=await authenticatedUser(req);if(!auth?.user)return null;const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role&limit=1`),profile=rows?.[0];return profile?.role==='admin'?{...auth,profile}:null}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const ctx=await adminContext(req);if(!ctx)return json(res,401,{error:'Administrator access is required.'});
  await enforceRateLimit(ctx.user.id,'admin/pilot-agent-overview',{limit:60,windowSeconds:60});
  const [runs,students,households,events]=await Promise.all([
   service('/rest/v1/test_runs?run_type=eq.full_journey&select=id,test_student_id,label,status,started_at,completed_at,notes&order=started_at.desc&limit=100'),
   service('/rest/v1/students?is_test_student=eq.true&select=id,profile_id,display_name,grade_level,target_exam,target_score,household_id,test_label,diagnostic_completed_at,diagnostic_math_mastery,diagnostic_rw_mastery,recommended_path,created_at&order=created_at.desc'),
   service('/rest/v1/households?is_test_household=eq.true&select=id,name,student_limit,created_at&order=created_at.desc'),
   service('/rest/v1/test_events?select=id,test_run_id,event_type,event_key,payload,created_at&order=created_at.desc&limit=500')
  ]);
  const pilotRuns=(runs||[]).filter(r=>String(r.label||'').startsWith(PILOT_AGENT_VERSION));
  const eventByRun=new Map();for(const e of events||[]){const list=eventByRun.get(e.test_run_id)||[];list.push(e);eventByRun.set(e.test_run_id,list)}
  const studentMap=new Map((students||[]).map(s=>[s.id,s])),householdMap=new Map((households||[]).map(h=>[h.id,h]));
  const items=pilotRuns.map(run=>{const student=studentMap.get(run.test_student_id),household=student?householdMap.get(student.household_id):null,runEvents=eventByRun.get(run.id)||[],diag=runEvents.find(e=>e.event_type==='pilot_diagnostic_completed')?.payload||null,practice=runEvents.filter(e=>e.event_type==='pilot_practice_completed').map(e=>e.payload);return{id:run.id,status:run.status,label:run.label,started_at:run.started_at,completed_at:run.completed_at,notes:run.notes,student:student?{id:student.id,display_name:student.display_name,grade_level:student.grade_level,target_exam:student.target_exam,target_score:student.target_score,persona:String(student.test_label||'').split(':')[1]||null,diagnostic_completed_at:student.diagnostic_completed_at,diagnostic_math_mastery:student.diagnostic_math_mastery,diagnostic_rw_mastery:student.diagnostic_rw_mastery,priority_skills:(student.recommended_path?.priority_skills||[]).slice(0,6)}:null,household:household?{id:household.id,name:household.name}:null,diagnostic:diag,practice};});
  return json(res,200,{ok:true,version:PILOT_AGENT_VERSION,personas:Object.entries(PILOT_PERSONAS).map(([key,p])=>({key,label:p.label,grade:p.grade,target_exam:p.targetExam,target_score:p.targetScore})),counts:{pilot_runs:items.length,completed:items.filter(x=>x.status==='completed').length,active:items.filter(x=>x.status==='active').length,test_students:(students||[]).length,test_households:(households||[]).length},runs:items.slice(0,50)});
 }catch(error){console.error('pilot-agent-overview',error?.message||error);if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));const status=Number(error.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?error.message:'Unable to load pilot agent operations right now.'})}
}
