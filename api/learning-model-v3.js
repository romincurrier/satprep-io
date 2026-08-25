import {assertAppRequestOrigin,json,studentContext,enforceRateLimit} from '../server/supabase-server.js';
import {rebuildLearningModel} from '../server/learning-model-core.js';

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  try{
    assertAppRequestOrigin(req);
    const ctx=await studentContext(req);
    if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});
    if(ctx.profile?.role!=='student'||!ctx.student)return json(res,403,{error:'A student account is required.'});
    await enforceRateLimit(ctx.user.id,'learning-model/rebuild',{limit:12,windowSeconds:60});
    const result=await rebuildLearningModel(ctx.student);
    return json(res,200,result);
  }catch(e){
    console.error('learning-model-v3',e);
    if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));
    return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to refresh the learning plan right now.'});
  }
}
