import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';
import {LIVE_PILOT_VERSION,pilotEnrollmentByToken} from '../server/live-pilot.js';

async function parentContext(req){
 const auth=await authenticatedUser(req);if(!auth?.user)return null;
 const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role,household_id,is_test_account&limit=1`),profile=rows?.[0];
 return profile?.role==='parent'&&profile.household_id?{...auth,profile}:null;
}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const ctx=await parentContext(req);if(!ctx)return json(res,401,{error:'A parent or guardian account is required to claim this pilot.'});
  await enforceRateLimit(ctx.user.id,'pilot/claim',{limit:8,windowSeconds:3600});
  const token=String(req.body?.token||'').trim();
  const enrollment=await pilotEnrollmentByToken(token);if(!enrollment)return json(res,404,{error:'Pilot invitation is invalid or unavailable.'});
  if(enrollment.status==='revoked'||enrollment.status==='completed')return json(res,409,{error:'This pilot invitation is no longer available.'});
  if(enrollment.status==='open'&&Date.parse(enrollment.expires_at)<=Date.now())return json(res,410,{error:'This pilot invitation has expired.'});
  if(enrollment.parent_profile_id&&enrollment.parent_profile_id!==ctx.profile.id)return json(res,409,{error:'This pilot invitation has already been claimed.'});

  const now=new Date().toISOString();
  if(enrollment.status==='open'){
   await service(`/rest/v1/pilot_enrollments?id=eq.${encodeURIComponent(enrollment.id)}&status=eq.open`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'claimed',parent_profile_id:ctx.profile.id,household_id:ctx.profile.household_id,claimed_at:now,metadata:{...(enrollment.metadata||{}),pilot_version:LIVE_PILOT_VERSION}})});
  }
  await Promise.all([
   service(`/rest/v1/profiles?id=eq.${encodeURIComponent(ctx.profile.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_test_account:true})}),
   service(`/rest/v1/households?id=eq.${encodeURIComponent(ctx.profile.household_id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_test_household:true})})
  ]);
  const students=await service(`/rest/v1/students?household_id=eq.${encodeURIComponent(ctx.profile.household_id)}&select=id`);
  return json(res,200,{ok:true,pilot:true,enrollment_id:enrollment.id,label:enrollment.label,student_count:(students||[]).length});
 }catch(error){console.error('live-pilot-claim',error?.message||error);if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));const status=Number(error.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?error.message:'Unable to claim the live pilot right now.'})}
}
