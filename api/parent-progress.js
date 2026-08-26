import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function parentContext(req){
 const auth=await authenticatedUser(req);if(!auth?.user)return null;
 const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role,household_id`),profile=rows?.[0];
 return profile?.role==='parent'&&profile.household_id?{...auth,profile}:null;
}

function unavailablePractice(err){return err?.status===400||err?.status===404}
function finite(value){const n=Number(value);return Number.isFinite(n)?n:null}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const ctx=await parentContext(req);if(!ctx)return json(res,401,{error:'A parent or guardian account is required.'});
  await enforceRateLimit(ctx.user.id,'parent/progress',{limit:60,windowSeconds:60});
  const raw=req.body&&typeof req.body==='object'?req.body:{};if(JSON.stringify(raw).length>500)return json(res,413,{error:'Request payload is too large.'});
  const studentId=String(raw.student_id||'');if(!UUID.test(studentId))return json(res,400,{error:'A valid student is required.'});
  const students=await service(`/rest/v1/students?id=eq.${encodeURIComponent(studentId)}&household_id=eq.${encodeURIComponent(ctx.profile.household_id)}&select=id,profile_id,diagnostic_completed_at&limit=1`),student=students?.[0];
  if(!student)return json(res,404,{error:'Student not found in this household.'});

  const [progress,skills]=await Promise.all([
   service(`/rest/v1/lesson_progress?student_id=eq.${encodeURIComponent(studentId)}&select=lesson_key,best_score,completed_at,updated_at`).catch(()=>[]),
   service(`/rest/v1/skill_mastery?student_id=eq.${encodeURIComponent(studentId)}&select=skill_key,mastery,items_attempted,updated_at`).catch(()=>[])
  ]);

  let practiceReady=true,sessions=[],responses=[];
  try{
   [sessions,responses]=await Promise.all([
    service(`/rest/v1/practice_sessions?student_id=eq.${encodeURIComponent(studentId)}&status=eq.completed&select=id,skill_key,score,mastery_after,completed_at&order=completed_at.desc&limit=25`),
    service(`/rest/v1/practice_responses?student_id=eq.${encodeURIComponent(studentId)}&scored_by_server=eq.true&select=is_correct,created_at&order=created_at.desc&limit=50`)
   ]);
  }catch(err){if(unavailablePractice(err)){practiceReady=false;sessions=[];responses=[]}else throw err}

  const completed=(progress||[]).filter(x=>x.completed_at).length;
  const normalizedSkills=(skills||[]).map(x=>({...x,mastery:finite(x.mastery)})).filter(x=>x.mastery!==null);
  const avgMastery=normalizedSkills.length?Math.round(normalizedSkills.reduce((sum,x)=>sum+x.mastery,0)/normalizedSkills.length*100):0;
  const weakest=normalizedSkills.slice().sort((a,b)=>a.mastery-b.mastery)[0]||null;
  const strongest=normalizedSkills.slice().sort((a,b)=>b.mastery-a.mastery)[0]||null;
  const recent=responses||[],correct=recent.filter(x=>x.is_correct===true).length,accuracy=recent.length?Math.round(correct/recent.length*100):null;
  const latestSession=(sessions||[])[0]||null;

  return json(res,200,{ok:true,student_id:studentId,summary:{
   completed,
   avgMastery,
   weakest:weakest?{skill_key:weakest.skill_key,mastery:weakest.mastery}:null,
   strongest:strongest?{skill_key:strongest.skill_key,mastery:strongest.mastery}:null,
   accuracy,
   attemptCount:recent.length,
   completedPracticeSessions:(sessions||[]).length,
   latestPracticeAt:latestSession?.completed_at||null,
   latestPracticeScore:finite(latestSession?.score),
   trustedPracticeReady:practiceReady,
   diagnosticComplete:!!student.diagnostic_completed_at
  }});
 }catch(e){console.error('parent-progress',e?.message||e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?e.message:status===503?e.message:'Unable to load student progress right now.'})}
}
