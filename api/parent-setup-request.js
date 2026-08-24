import {json,service,enforceRateLimit} from '../server/supabase-server.js';

const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function allowedOrigin(req){const origin=String(req.headers.origin||'');if(!origin)return true;try{const h=new URL(origin).hostname.toLowerCase();return h==='satprep.io'||h==='www.satprep.io'||h.endsWith('.vercel.app')||h==='localhost'||h==='127.0.0.1'}catch{return false}}
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});if(!allowedOrigin(req))return json(res,403,{error:'Request origin not allowed.'});
 try{
  const email=String(req.body?.parent_email||'').trim().toLowerCase();if(!EMAIL.test(email)||email.length>254)return json(res,400,{error:'Enter a valid parent or guardian email.'});
  await enforceRateLimit(email,'parent/setup-request',{limit:3,windowSeconds:3600});
  const since=new Date(Date.now()-60*60*1000).toISOString();const recent=await service(`/rest/v1/parent_setup_requests?parent_email=ilike.${encodeURIComponent(email)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=1`);
  if(!recent?.length)await service('/rest/v1/parent_setup_requests',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({parent_email:email,age_band:'under13'})});
  // Deliberately return the same success shape whether this is a new or recent request.
  return json(res,202,{accepted:true});
 }catch(e){console.error('parent-setup-request',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status<500?status:503,{error:status&&status<500?e.message:'Unable to save the parent setup request right now.'})}
}
