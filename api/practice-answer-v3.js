import {json,studentContext,enforceRateLimit} from '../server/supabase-server.js';
import {scorePracticeAnswer} from '../server/practice-core.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});if(ctx.profile?.role!=='student'||!ctx.student)return json(res,403,{error:'A student account is required.'});
  await enforceRateLimit(ctx.user.id,'practice/answer',{limit:80,windowSeconds:60});
  const raw=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});if(JSON.stringify(raw).length>1000)return json(res,413,{error:'Practice answer is too large.'});const sessionId=String(raw.session_id||''),position=Number(raw.position),selected=Number(raw.selected_answer),responseMs=Number(raw.response_ms||0);if(!UUID.test(sessionId))return json(res,400,{error:'A valid practice session is required.'});if(!Number.isInteger(position)||position<0||position>100)return json(res,400,{error:'Practice question position is invalid.'});if(!Number.isInteger(selected)||selected<0||selected>3)return json(res,400,{error:'Selected answer is invalid.'});if(!Number.isFinite(responseMs)||responseMs<0||responseMs>3600000)return json(res,400,{error:'Practice response time is invalid.'});
  const result=await scorePracticeAnswer(ctx.student,sessionId,position,selected,responseMs);return json(res,200,result);
 }catch(e){console.error('practice-answer-v3',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to save this practice answer right now.'})}
}
