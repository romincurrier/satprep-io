import {assertAppReadOrigin,json,studentContext,enforceRateLimit} from '../server/supabase-server.js';
import {questionForPractice} from '../server/practice-core.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppReadOrigin(req);
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});if(ctx.profile?.role!=='student'||!ctx.student)return json(res,403,{error:'A student account is required.'});
  await enforceRateLimit(ctx.user.id,'practice/item',{limit:60,windowSeconds:60});
  const sessionId=String(req.query.session_id||''),position=Number(req.query.position);if(!UUID.test(sessionId))return json(res,400,{error:'A valid practice session is required.'});if(!Number.isInteger(position)||position<0||position>100)return json(res,400,{error:'Practice question position is invalid.'});
  const{question}=await questionForPractice(ctx.student.id,sessionId,position,{enforceCurrent:true});return json(res,200,{question});
 }catch(e){console.error('practice-item-v3',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to load this practice question.'})}
}
