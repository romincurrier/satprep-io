import {assertAppRequestOrigin,authenticatedUser,enforceRateLimit,json,service} from '../server/supabase-server.js';

const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function studentContext(req){
 const auth=await authenticatedUser(req);if(!auth?.user)return null;
 const profiles=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,email,role,household_id`),profile=profiles?.[0];
 if(!profile||profile.role!=='student')return{...auth,profile,student:null};
 const students=await service(`/rest/v1/students?profile_id=eq.${encodeURIComponent(profile.id)}&select=id,profile_id,household_id&limit=1`);
 return{...auth,profile,student:students?.[0]||null};
}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  assertAppRequestOrigin(req);
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in required.'});if(!ctx.student)return json(res,403,{error:'A student account is required.'});
  if(ctx.profile.household_id||ctx.student.household_id)return json(res,409,{error:'This student is already linked to a household.'});
  await enforceRateLimit(ctx.user.id,'student/parent-invitation-create',{limit:5,windowSeconds:86400});
  const raw=req.body&&typeof req.body==='object'?req.body:{};if(JSON.stringify(raw).length>500)return json(res,413,{error:'Request payload is too large.'});
  const parentEmail=String(raw.parent_email||'').trim().toLowerCase();if(!EMAIL.test(parentEmail)||parentEmail.length>254)return json(res,400,{error:'Enter a valid parent or guardian email.'});
  if(parentEmail===String(ctx.profile.email||ctx.user.email||'').trim().toLowerCase())return json(res,400,{error:'Use a parent or guardian email different from the student login.'});
  const pending=await service(`/rest/v1/parent_invitations?student_profile_id=eq.${encodeURIComponent(ctx.profile.id)}&parent_email=ilike.${encodeURIComponent(parentEmail)}&status=eq.pending&select=id,parent_email,status,expires_at,created_at&order=created_at.desc&limit=1`);
  if(pending?.[0])return json(res,200,{ok:true,existing:true,invitation:{id:pending[0].id,parent_email:pending[0].parent_email,status:pending[0].status,expires_at:pending[0].expires_at||null}});
  const expiresAt=new Date(Date.now()+7*24*60*60*1000).toISOString();
  const created=await service('/rest/v1/parent_invitations',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({student_profile_id:ctx.profile.id,parent_email:parentEmail,status:'pending',expires_at:expiresAt})});
  const inv=created?.[0];if(!inv?.id)throw new Error('Parent invitation could not be created.');
  return json(res,201,{ok:true,existing:false,invitation:{id:inv.id,parent_email:parentEmail,status:'pending',expires_at:inv.expires_at||expiresAt}});
 }catch(e){console.error('student-parent-invitation',e?.message||e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?e.message:status===503?e.message:'Unable to create the parent invitation right now.'})}
}
