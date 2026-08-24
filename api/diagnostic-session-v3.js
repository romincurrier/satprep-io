import {json,studentContext} from '../server/supabase-server.js';
import {ensureSecureAttempt,bankMetadata} from '../server/diagnostic-core.js';

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});if(ctx.profile?.role!=='student'||!ctx.student)return json(res,403,{error:'A student account is required.'});if(!ctx.student.onboarding_complete)return json(res,409,{error:'Complete your learner profile before starting the diagnostic.'});
  const state=await ensureSecureAttempt(ctx.student);if(state.completedDiagnostic)return json(res,200,{completed:true});
  return json(res,200,{completed:false,legacy:state.legacy,attempt_id:state.attempt.id,answered:state.completed,total:state.total,engine:state.legacy?'legacy':'secure-v3',content:bankMetadata()});
 }catch(e){console.error('diagnostic-session-v3',e);return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to open the diagnostic right now.'})}
}
