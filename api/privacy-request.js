import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES=new Set(['access','correction','deletion','account_closure','other_privacy']);

async function requester(req){
 const auth=await authenticatedUser(req);if(!auth?.user)return null;
 const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role,household_id`);
 const profile=rows?.[0];return profile?{...auth,profile}:null;
}
async function mayTarget(profile,studentId){
 if(!studentId)return true;
 if(profile.role==='student'){
  const rows=await service(`/rest/v1/students?id=eq.${encodeURIComponent(studentId)}&profile_id=eq.${encodeURIComponent(profile.id)}&select=id&limit=1`);return !!rows?.[0];
 }
 if(profile.role==='parent'){
  const rows=await service(`/rest/v1/parent_students?parent_profile_id=eq.${encodeURIComponent(profile.id)}&student_id=eq.${encodeURIComponent(studentId)}&select=student_id&limit=1`);return !!rows?.[0];
 }
 return false;
}
function safeRows(rows){return (rows||[]).map(r=>({id:r.id,target_student_id:r.target_student_id||null,request_type:r.request_type,status:r.status,submitted_at:r.submitted_at,updated_at:r.updated_at,verified_at:r.verified_at||null,completed_at:r.completed_at||null,resolution_code:r.resolution_code||null}))}

export default async function handler(req,res){
 try{
  if(req.method==='POST')assertAppRequestOrigin(req);
  const auth=await requester(req);if(!auth)return json(res,401,{error:'Sign in required.'});
  if(req.method==='GET'){
   await enforceRateLimit(auth.user.id,'privacy/request-read',{limit:30,windowSeconds:3600});
   let rows;try{rows=await service(`/rest/v1/privacy_requests?requester_profile_id=eq.${encodeURIComponent(auth.profile.id)}&select=id,target_student_id,request_type,status,submitted_at,updated_at,verified_at,completed_at,resolution_code&order=submitted_at.desc&limit=50`)}catch(e){if(e.status===400||e.status===404)throw Object.assign(new Error('Privacy request service is not ready.'),{status:503});throw e}
   return json(res,200,{requests:safeRows(rows)});
  }
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  const raw=req.body&&typeof req.body==='object'?req.body:{};if(JSON.stringify(raw).length>1000)return json(res,413,{error:'Request payload is too large.'});
  await enforceRateLimit(auth.user.id,'privacy/request-create',{limit:8,windowSeconds:86400});
  const requestType=String(raw.request_type||'').trim(),target=raw.target_student_id==null||raw.target_student_id===''?null:String(raw.target_student_id).trim();
  if(!TYPES.has(requestType))return json(res,400,{error:'Choose a valid privacy request type.'});
  if(target&&!UUID.test(target))return json(res,400,{error:'Invalid student selection.'});
  if(!(await mayTarget(auth.profile,target)))return json(res,403,{error:'You can submit a request only for your own account or a linked student.'});
  const targetFilter=target?`target_student_id=eq.${encodeURIComponent(target)}`:'target_student_id=is.null';
  let existing;try{existing=await service(`/rest/v1/privacy_requests?requester_profile_id=eq.${encodeURIComponent(auth.profile.id)}&${targetFilter}&request_type=eq.${encodeURIComponent(requestType)}&status=in.(submitted,verification_required,in_review)&select=id,target_student_id,request_type,status,submitted_at,updated_at,verified_at,completed_at,resolution_code&order=submitted_at.desc&limit=1`)}catch(e){if(e.status===400||e.status===404)throw Object.assign(new Error('Privacy request service is not ready.'),{status:503});throw e}
  if(existing?.[0])return json(res,200,{ok:true,existing:true,request:safeRows(existing)[0]});
  let created;try{created=await service('/rest/v1/privacy_requests',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({requester_profile_id:auth.profile.id,target_student_id:target,request_type:requestType,status:'submitted'})})}catch(e){if(e.status===400||e.status===404)throw Object.assign(new Error('Privacy request service is not ready.'),{status:503});throw e}
  const request=safeRows(created)[0];if(!request)throw new Error('Privacy request could not be recorded.');
  return json(res,201,{ok:true,existing:false,request});
 }catch(e){console.error('privacy-request',e?.message||e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?e.message:status===503?e.message:'Unable to process the privacy request right now.'})}
}
