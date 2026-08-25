import {assertAppRequestOrigin,json,studentContext,enforceRateLimit} from '../server/supabase-server.js';
import {scoreDiagnosticAnswer} from '../server/diagnostic-core.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const raw=req.body&&typeof req.body==='object'?req.body:{};
  if(JSON.stringify(raw).length>1000)return json(res,413,{error:'Diagnostic answer payload is too large.'});
  const attemptId=String(raw.attempt_id||'').trim(),position=Number(raw.position),responseMs=Number(raw.response_ms),hasChoice=raw.selected_answer!==undefined&&raw.selected_answer!==null,hasText=raw.response_text!==undefined&&raw.response_text!==null;
  if(!UUID.test(attemptId))return json(res,400,{error:'Diagnostic attempt is invalid.'});
  if(!Number.isInteger(position)||position<0||position>100)return json(res,400,{error:'Question position is invalid.'});
  if(hasChoice===hasText)return json(res,400,{error:'Submit exactly one assessment response.'});
  const submitted=hasText?String(raw.response_text):Number(raw.selected_answer);
  if(hasChoice&&(!Number.isInteger(submitted)||submitted<0||submitted>3))return json(res,400,{error:'Selected answer is invalid.'});
  if(!Number.isFinite(responseMs)||responseMs<0||responseMs>86400000)return json(res,400,{error:'Response time is invalid.'});
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});if(ctx.profile?.role!=='student'||!ctx.student)return json(res,403,{error:'A student account is required.'});
  await enforceRateLimit(ctx.user.id,'diagnostic/answer',{limit:40,windowSeconds:60});
  const result=await scoreDiagnosticAnswer(ctx.student,attemptId,position,submitted,responseMs);return json(res,200,result);
 }catch(e){console.error('diagnostic-answer-v3',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to save this diagnostic answer.'})}
}
