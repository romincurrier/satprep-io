import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,removeStorageObjects,service} from '../server/supabase-server.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REPORT_PATH=/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.pdf$/i;

async function requester(req){
 const auth=await authenticatedUser(req);if(!auth?.user)return null;
 const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role`);
 const profile=rows?.[0];return profile?{...auth,profile}:null;
}

async function mayManage(profile,studentId){
 if(profile.role==='admin')return true;
 if(profile.role==='student'){
  const rows=await service(`/rest/v1/students?id=eq.${encodeURIComponent(studentId)}&profile_id=eq.${encodeURIComponent(profile.id)}&select=id&limit=1`);
  return !!rows?.[0];
 }
 if(profile.role==='parent'){
  const rows=await service(`/rest/v1/parent_students?parent_profile_id=eq.${encodeURIComponent(profile.id)}&student_id=eq.${encodeURIComponent(studentId)}&select=student_id&limit=1`);
  return !!rows?.[0];
 }
 return false;
}

function trustedReportPath(row){
 if(!row.file_path)return null;
 const match=String(row.file_path).match(REPORT_PATH);
 if(!match||match[1].toLowerCase()!==String(row.created_by||'').toLowerCase()||match[2].toLowerCase()!==String(row.student_id||'').toLowerCase()){
  throw Object.assign(new Error('Stored report identity could not be verified.'),{status:409});
 }
 return row.file_path;
}

export default async function handler(req,res){
 try{
  if(req.method!=='DELETE')return json(res,405,{error:'Method not allowed'});
  assertAppRequestOrigin(req);
  const auth=await requester(req);if(!auth)return json(res,401,{error:'Sign in required.'});
  await enforceRateLimit(auth.user.id,'privacy/prior-assessment-delete',{limit:20,windowSeconds:86400});
  const raw=req.body&&typeof req.body==='object'?req.body:{};
  if(JSON.stringify(raw).length>500)return json(res,413,{error:'Request payload is too large.'});
  const assessmentId=String(raw.assessment_id||'').trim();
  if(!UUID.test(assessmentId))return json(res,400,{error:'Invalid assessment selection.'});

  const rows=await service(`/rest/v1/prior_assessments?id=eq.${encodeURIComponent(assessmentId)}&select=id,student_id,created_by,file_path,source_method&limit=1`);
  const row=rows?.[0];if(!row)return json(res,404,{error:'Assessment report not found.'});
  if(!(await mayManage(auth.profile,row.student_id)))return json(res,403,{error:'You do not have access to this assessment report.'});

  const filePath=trustedReportPath(row);
  if(filePath)await removeStorageObjects('assessment-reports',[filePath]);

  const result=await service('/rest/v1/rpc/delete_prior_assessment_record',{method:'POST',body:JSON.stringify({p_assessment_id:assessmentId})});
  const deleted=Array.isArray(result)?result[0]:result;
  if(deleted!==true&&deleted!=='true')return json(res,200,{ok:true,already_deleted:true});
  return json(res,200,{ok:true});
 }catch(e){
  console.error('prior-assessment-report',e?.message||e);
  if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));
  const status=Number(e.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?e.message:'Unable to delete the assessment report right now.'});
 }
}
