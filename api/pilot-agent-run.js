import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';
import {PILOT_PERSONAS,runPilotAgent} from '../server/pilot-agent-core-v2.js';

async function adminContext(req){const auth=await authenticatedUser(req);if(!auth?.user)return null;const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role&limit=1`),profile=rows?.[0];return profile?.role==='admin'?{...auth,profile}:null}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const ctx=await adminContext(req);if(!ctx)return json(res,401,{error:'Administrator access is required.'});
  await enforceRateLimit(ctx.user.id,'admin/pilot-agent-run',{limit:10,windowSeconds:3600});
  const persona=String(req.body?.persona||'balanced_middle').trim();if(!PILOT_PERSONAS[persona])return json(res,400,{error:'Choose a supported pilot persona.'});
  const result=await runPilotAgent(ctx.profile.id,persona);
  return json(res,201,{ok:true,...result});
 }catch(error){console.error('pilot-agent-run',error?.message||error);if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));const status=Number(error.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?error.message:'Unable to run the pilot agent right now.'})}
}
