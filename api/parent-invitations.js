import {assertAppRequestOrigin,authenticatedUser,json,service,enforceRateLimit} from '../server/supabase-server.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function parentContext(user){const rows=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,email,role,household_id,billing_owner`),p=rows?.[0];if(!p||p.role!=='parent')return null;return p}
async function pendingFor(p){const email=String(p.email||'').trim().toLowerCase();if(!email)return[];const rows=await service(`/rest/v1/parent_invitations?parent_email=ilike.${encodeURIComponent(email)}&status=eq.pending&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,student_profile_id,parent_email,expires_at,created_at&order=created_at.desc`);const out=[];for(const inv of rows||[]){const s=await service(`/rest/v1/students?profile_id=eq.${encodeURIComponent(inv.student_profile_id)}&select=id,first_name,last_name,display_name,household_id`),student=s?.[0];if(student)out.push({...inv,student:{id:student.id,name:student.display_name||[student.first_name,student.last_name].filter(Boolean).join(' ')||'Student'}})}return out}
function acceptanceResponse(res,state){
 const code=String(state?.code||'');
 if(state?.ok&&code==='accepted')return json(res,200,{ok:true,student_id:state.student_id,household_id:state.household_id});
 if(code==='invitation_expired')return json(res,410,{error:'That invitation has expired.'});
 if(code==='student_missing')return json(res,404,{error:'Student record not found.'});
 if(code==='student_household_conflict')return json(res,409,{error:'This student is already linked to another household.'});
 if(code==='requires_family_plan')return json(res,409,{error:'This household currently has an Individual plan. Upgrade to a Family plan before accepting another student.',requires_family_plan:true});
 if(code==='parent_required')return json(res,403,{error:'A parent or guardian account is required.'});
 if(code==='invitation_unavailable')return json(res,404,{error:'That invitation is no longer available.'});
 throw Object.assign(new Error('Invitation acceptance service is not ready.'),{status:503});
}
export default async function handler(req,res){
 try{
  if(req.method==='POST')assertAppRequestOrigin(req);
  const auth=await authenticatedUser(req),user=auth?.user;if(!user)return json(res,401,{error:'Sign in required.'});const p=await parentContext(user);if(!p)return json(res,403,{error:'A parent or guardian account is required.'});
  if(req.method==='GET'){await enforceRateLimit(user.id,'parent/invitations/read',{limit:60,windowSeconds:60});return json(res,200,{invitations:await pendingFor(p)})}
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  await enforceRateLimit(user.id,'parent/invitations/accept',{limit:10,windowSeconds:3600});
  const invitation_id=String(req.body?.invitation_id||'').trim();if(!UUID.test(invitation_id))return json(res,400,{error:'Invitation is required.'});
  // Household creation, student/profile linkage, invitation consumption, and the
  // existing product consent record now commit as one service-only DB transaction.
  // Final parental-consent notice/version/legal acceptance remains a launch gate.
  const raw=await service('/rest/v1/rpc/accept_parent_invitation_atomic',{method:'POST',body:JSON.stringify({p_invitation_id:invitation_id,p_parent_profile_id:p.id,p_consent_version:'2026-08'})});
  const state=Array.isArray(raw)?raw[0]:raw;
  return acceptanceResponse(res,state);
 }catch(e){console.error('parent-invitations',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?e.message:'Unable to process this invitation right now.'})}
}
