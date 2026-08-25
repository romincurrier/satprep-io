import {assertAppRequestOrigin,authenticatedUser,json,service,enforceRateLimit} from '../server/supabase-server.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function parentProfile(user){const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,email,role,household_id,billing_owner`);return rows?.[0]||null}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const auth=await authenticatedUser(req),user=auth?.user;if(!user)return json(res,401,{error:'Sign in required.'});const p=await parentProfile(user);if(!p||p.role!=='parent'||!p.household_id)return json(res,403,{error:'A parent or guardian must activate the student login.'});
  await enforceRateLimit(user.id,'account/student-activation',{limit:5,windowSeconds:3600});
  const studentId=String(req.body?.student_id||'').trim(),normalized=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');if(!UUID.test(studentId)||!EMAIL.test(normalized)||normalized.length>254||!password)return json(res,400,{error:'Valid student, email and password are required.'});if(password.length<8)return json(res,400,{error:'Password must be at least 8 characters.'});if(password.length>200)return json(res,400,{error:'Password is too long.'});
  const link=await service(`/rest/v1/parent_students?parent_profile_id=eq.${encodeURIComponent(p.id)}&student_id=eq.${encodeURIComponent(studentId)}&select=student_id`);if(!Array.isArray(link)||!link.length)return json(res,403,{error:'That student is not linked to this parent account.'});
  const students=await service(`/rest/v1/students?id=eq.${encodeURIComponent(studentId)}&household_id=eq.${encodeURIComponent(p.household_id)}&select=id,profile_id,first_name,last_name,display_name,household_id,date_of_birth`),s=students?.[0];if(!s)return json(res,404,{error:'Student not found.'});if(s.profile_id)return json(res,409,{error:'This student already has a login.'});
  const subs=await service(`/rest/v1/subscriptions?household_id=eq.${encodeURIComponent(p.household_id)}&select=status&order=created_at.desc&limit=1`),subStatus=subs?.[0]?.status;if(!['trialing','active'].includes(subStatus))return json(res,403,{error:'Activate a household trial or subscription before creating the student login.'});
  let created;try{created=await service('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email:normalized,password,email_confirm:true,user_metadata:{role:'student',first_name:s.first_name||'',last_name:s.last_name||'',household_id:p.household_id},app_metadata:{satprep_parent_authorized:true,account_origin:'parent_activation'}})})}catch(e){if(e.status===422||/already|registered|exists/i.test(String(e.message||'')))return json(res,409,{error:'That email is already associated with a SATprep.io account. Use a different email or sign in with the existing account.'});throw e}
  const uid=created?.id;if(!uid)throw new Error('Student account could not be created.');
  const temp=await service(`/rest/v1/students?profile_id=eq.${encodeURIComponent(uid)}&select=id`);for(const row of temp||[])if(row.id!==studentId)await service(`/rest/v1/students?id=eq.${encodeURIComponent(row.id)}`,{method:'DELETE'});
  await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}`,{method:'PATCH',body:JSON.stringify({email:normalized,first_name:s.first_name||'',last_name:s.last_name||'',role:'student',household_id:p.household_id,date_of_birth:s.date_of_birth||null})});await service(`/rest/v1/students?id=eq.${encodeURIComponent(studentId)}`,{method:'PATCH',body:JSON.stringify({profile_id:uid})});
  // Existing product consent event. Before under-13 commercial launch, the notice,
  // verification method, consent version, revocation, and deletion rights require legal/privacy review.
  await service('/rest/v1/parental_consents',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({student_profile_id:uid,parent_profile_id:p.id,consent_type:'account_and_data',consent_version:'2026-08'})});
  return json(res,200,{ok:true,email:normalized,student_id:studentId});
 }catch(e){console.error('activate-student-login',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to activate the student login right now.'})}
}
