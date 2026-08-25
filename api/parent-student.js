import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';

const EXAMS=new Set(['PSAT','PSAT/NMSQT','SAT']);
const NAME=/^[\p{L}\p{M}' .-]{1,80}$/u;
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(`${value}T00:00:00Z`);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value&&d<=new Date()}
async function parentContext(req){
 const auth=await authenticatedUser(req);if(!auth?.user)return null;
 const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role,household_id,billing_owner`),profile=rows?.[0];
 return profile?.role==='parent'?{...auth,profile}:null;
}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const ctx=await parentContext(req);if(!ctx)return json(res,401,{error:'A parent or guardian account is required.'});if(!ctx.profile.household_id)return json(res,409,{error:'Finish creating the household before adding a student.'});
  await enforceRateLimit(ctx.user.id,'parent/student-create',{limit:10,windowSeconds:86400});
  const raw=req.body&&typeof req.body==='object'?req.body:{};if(JSON.stringify(raw).length>1500)return json(res,413,{error:'Request payload is too large.'});
  const first=String(raw.first_name||'').trim(),last=String(raw.last_name||'').trim(),dob=String(raw.date_of_birth||'').trim(),grade=Number(raw.grade_level),exam=String(raw.target_exam||'PSAT').trim();
  if(!NAME.test(first)||!NAME.test(last))return json(res,400,{error:'Enter a valid student first and last name.'});
  if(!validDate(dob))return json(res,400,{error:'Enter a valid date of birth.'});
  if(!Number.isInteger(grade)||grade<4||grade>12)return json(res,400,{error:'Choose a grade from 4 through 12.'});
  if(!EXAMS.has(exam))return json(res,400,{error:'Choose a supported SAT or PSAT test goal.'});
  const existing=await service(`/rest/v1/students?household_id=eq.${encodeURIComponent(ctx.profile.household_id)}&select=id,first_name,last_name,date_of_birth,created_at&order=created_at.asc`),count=Array.isArray(existing)?existing.length:0;
  if(count>=3)return json(res,409,{error:'This household already has the maximum of three student records.'});
  const duplicate=(existing||[]).find(s=>String(s.first_name||'').trim().toLowerCase()===first.toLowerCase()&&String(s.last_name||'').trim().toLowerCase()===last.toLowerCase()&&String(s.date_of_birth||'')===dob);
  if(duplicate)return json(res,409,{error:'A matching student is already in this household.',student_id:duplicate.id});
  const displayName=`${first} ${last}`;
  const rows=await service('/rest/v1/students',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({household_id:ctx.profile.household_id,first_name:first,last_name:last,display_name:displayName,date_of_birth:dob,grade_level:grade,target_exam:exam})}),student=rows?.[0];
  if(!student?.id)throw new Error('Student record could not be created.');
  try{await service('/rest/v1/parent_students?on_conflict=parent_profile_id,student_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({parent_profile_id:ctx.profile.id,student_id:student.id})})}catch(e){await service(`/rest/v1/students?id=eq.${encodeURIComponent(student.id)}`,{method:'DELETE'}).catch(()=>{});throw e}
  return json(res,201,{ok:true,student:{id:student.id,first_name:first,last_name:last,display_name:displayName,grade_level:grade,target_exam:exam}});
 }catch(e){console.error('parent-student',e?.message||e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?e.message:status===503?e.message:'Unable to add the student right now.'})}
}
