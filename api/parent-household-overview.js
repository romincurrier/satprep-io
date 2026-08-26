import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';

async function parentContext(req){
  const auth=await authenticatedUser(req);
  if(!auth?.user)return null;
  const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,email,first_name,last_name,role,household_id&limit=1`);
  const profile=rows?.[0];
  return profile?.role==='parent'&&profile.household_id?{...auth,profile}:null;
}

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  try{
    assertAppRequestOrigin(req);
    const ctx=await parentContext(req);
    if(!ctx)return json(res,401,{error:'A parent or guardian account is required.'});
    await enforceRateLimit(ctx.user.id,'parent/household-overview',{limit:60,windowSeconds:60});
    const students=await service(`/rest/v1/students?household_id=eq.${encodeURIComponent(ctx.profile.household_id)}&select=id,profile_id,first_name,last_name,display_name,grade_level,target_exam,target_score,onboarding_complete,diagnostic_completed_at,created_at&order=created_at.asc`);
    return json(res,200,{
      ok:true,
      profile:{id:ctx.profile.id,email:ctx.profile.email,first_name:ctx.profile.first_name,last_name:ctx.profile.last_name,role:'parent'},
      students:(students||[]).map(student=>({
        id:student.id,
        profile_id:student.profile_id,
        first_name:student.first_name,
        last_name:student.last_name,
        display_name:student.display_name,
        grade_level:student.grade_level,
        target_exam:student.target_exam,
        target_score:student.target_score,
        onboarding_complete:!!student.onboarding_complete,
        diagnostic_completed_at:student.diagnostic_completed_at,
        created_at:student.created_at
      }))
    });
  }catch(error){
    console.error('parent-household-overview',error?.message||error);
    if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));
    const status=Number(error.status);
    return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?error.message:'Unable to load the household right now.'});
  }
}
