import {assertAppRequestOrigin,enforceRateLimit,json,service,studentContext} from '../server/supabase-server.js';

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});
  const s=ctx.student;if(ctx.profile?.role!=='student'||!ctx.profile?.is_test_account||!s?.is_test_student||!String(s.test_label||'').startsWith('live-pilot:'))return json(res,403,{error:'Live pilot student access is required.'});
  await enforceRateLimit(ctx.user.id,'pilot/sync-path',{limit:20,windowSeconds:60});
  if(!s.diagnostic_completed_at)return json(res,200,{ok:true,changed:false});
  const path=s.recommended_path&&typeof s.recommended_path==='object'?s.recommended_path:{};
  const priority=Array.isArray(path.priority_skills)&&path.priority_skills.length?path.priority_skills:Array.isArray(path.diagnostic_priority_skills)?path.diagnostic_priority_skills:Array.isArray(path.diagnostic?.priority_skills)?path.diagnostic.priority_skills:[];
  const strengths=Array.isArray(path.strengths)&&path.strengths.length?path.strengths:Array.isArray(path.diagnostic_strengths)?path.diagnostic_strengths:Array.isArray(path.diagnostic?.strengths)?path.diagnostic.strengths:[];
  if(!priority.length||Array.isArray(path.priority_skills)&&path.priority_skills.length)return json(res,200,{ok:true,changed:false,priority_count:priority.length});
  const merged={...path,priority_skills:priority,strengths,pilot_adaptive_bridge:'live-pilot-v1'};
  await service(`/rest/v1/students?id=eq.${encodeURIComponent(s.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({recommended_path:merged})});
  return json(res,200,{ok:true,changed:true,priority_count:priority.length});
 }catch(error){console.error('live-pilot-sync-path',error?.message||error);if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));const status=Number(error.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?error.message:'Unable to synchronize the pilot learning path.'})}
}
