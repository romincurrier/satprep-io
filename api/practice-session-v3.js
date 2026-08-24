import {json,studentContext,enforceRateLimit} from '../server/supabase-server.js';
import {ensurePracticeSession} from '../server/practice-core.js';

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});if(ctx.profile?.role!=='student'||!ctx.student)return json(res,403,{error:'A student account is required.'});if(!ctx.student.diagnostic_completed_at)return json(res,409,{error:'Complete your initial diagnostic before starting guided practice.'});
  await enforceRateLimit(ctx.user.id,'practice/session',{limit:20,windowSeconds:60});
  const raw=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});if(JSON.stringify(raw).length>500)return json(res,413,{error:'Practice request is too large.'});const skill=String(raw.skill_key||'').trim();if(!skill||skill.length>120)return json(res,400,{error:'A valid practice skill is required.'});
  const state=await ensurePracticeSession(ctx.student,skill);return json(res,200,{session_id:state.session.id,skill_key:state.session.skill_key,answered:state.answered,total:state.total,resumed:state.resumed,status:state.session.status});
 }catch(e){console.error('practice-session-v3',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to open guided practice right now.'})}
}
