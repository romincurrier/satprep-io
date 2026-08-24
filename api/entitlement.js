import {authenticatedUser,json,service} from '../server/supabase-server.js';

export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 try{
  const auth=await authenticatedUser(req),user=auth?.user;if(!user)return json(res,401,{error:'Sign in required'});const profiles=await service(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role,household_id`),p=profiles?.[0];if(!p)return json(res,403,{error:'Profile not found'});if(p.role==='admin')return json(res,200,{entitled:true,role:'admin',status:'admin'});if(!p.household_id)return json(res,200,{entitled:false,role:p.role,status:'no_household'});
  const subs=await service(`/rest/v1/subscriptions?household_id=eq.${encodeURIComponent(p.household_id)}&select=status,plan_key,trial_ends_at,current_period_end,cancel_at_period_end&order=created_at.desc&limit=1`),s=subs?.[0]||null,entitled=!!s&&['trialing','active'].includes(s.status);return json(res,200,{entitled,role:p.role,status:s?.status||'inactive',plan_key:s?.plan_key||null,trial_ends_at:s?.trial_ends_at||null,current_period_end:s?.current_period_end||null,cancel_at_period_end:!!s?.cancel_at_period_end});
 }catch(e){console.error('entitlement',e);return json(res,500,{error:'Unable to verify subscription access.'})}
}
