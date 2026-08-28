import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';

async function adminContext(req){const auth=await authenticatedUser(req);if(!auth?.user)return null;const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role&limit=1`),profile=rows?.[0];return profile?.role==='admin'?{...auth,profile}:null}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const ctx=await adminContext(req);if(!ctx)return json(res,401,{error:'Administrator access is required.'});
  await enforceRateLimit(ctx.user.id,'admin/pilot-agent-delete',{limit:20,windowSeconds:3600});
  const studentId=String(req.body?.student_id||'').trim();if(!/^[0-9a-f-]{36}$/i.test(studentId))return json(res,400,{error:'Valid pilot student id required.'});
  const rows=await service(`/rest/v1/students?id=eq.${encodeURIComponent(studentId)}&is_test_student=eq.true&select=id,profile_id,household_id,test_label&limit=1`),student=rows?.[0];
  if(!student||!String(student.test_label||'').startsWith('pilot-agent-v1:'))return json(res,404,{error:'Pilot student not found.'});
  const householdRows=student.household_id?await service(`/rest/v1/households?id=eq.${encodeURIComponent(student.household_id)}&is_test_household=eq.true&select=id&limit=1`):[],household=householdRows?.[0];if(!household)return json(res,409,{error:'Pilot household boundary could not be verified.'});
  const links=await service(`/rest/v1/parent_students?student_id=eq.${encodeURIComponent(student.id)}&select=parent_profile_id`),parentId=links?.[0]?.parent_profile_id||null;
  if(student.profile_id)await service(`/auth/v1/admin/users/${encodeURIComponent(student.profile_id)}`,{method:'DELETE'});
  else await service(`/rest/v1/students?id=eq.${encodeURIComponent(student.id)}`,{method:'DELETE'});
  if(parentId){const parentRows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(parentId)}&is_test_account=eq.true&select=id&limit=1`);if(parentRows?.[0])await service(`/auth/v1/admin/users/${encodeURIComponent(parentId)}`,{method:'DELETE'});}
  await service(`/rest/v1/households?id=eq.${encodeURIComponent(household.id)}&is_test_household=eq.true`,{method:'DELETE'}).catch(()=>{});
  return json(res,200,{ok:true,deleted_student_id:student.id,deleted_household_id:household.id});
 }catch(error){console.error('pilot-agent-delete',error?.message||error);if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));const status=Number(error.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?error.message:'Unable to remove the pilot family right now.'})}
}
