import {assertAppRequestOrigin,json,studentContext,enforceRateLimit} from '../server/supabase-server.js';
import {questionForAttempt} from '../server/diagnostic-core.js';

export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});if(ctx.profile?.role!=='student'||!ctx.student)return json(res,403,{error:'A student account is required.'});
  await enforceRateLimit(ctx.user.id,'diagnostic/item',{limit:40,windowSeconds:60});
  const attemptId=String(req.query.attempt_id||''),position=Number(req.query.position);if(!attemptId)return json(res,400,{error:'Diagnostic attempt is required.'});const{question}=await questionForAttempt(ctx.student.id,attemptId,position,{enforceCurrent:true});return json(res,200,{question});
 }catch(e){console.error('diagnostic-item-v3',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to load this diagnostic question.'})}
}
