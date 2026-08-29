import directHandler from './full-browser-self-pilot-direct.js';
import {enforceRateLimit,json,service} from '../server/supabase-server.js';

const KEY=/^[a-f0-9]{64}$/;
const LABEL='Live Family Pilot #1';

export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  const runKey=String(req.query?.run_key||'').trim().toLowerCase();
  if(!KEY.test(runKey))return json(res,404,{error:'Not found'});
  try{
    await enforceRateLimit(runKey,'pilot/direct-trigger',{limit:1,windowSeconds:3600});
    const matches=await service(`/rest/v1/pilot_enrollments?token_hash=eq.${runKey}&label=eq.${encodeURIComponent(LABEL)}&status=eq.open&parent_profile_id=is.null&household_id=is.null&student_id=is.null&select=id,label,status,metadata,created_at&limit=2`);
    const enrollment=Array.isArray(matches)?matches[0]:null;
    if(!enrollment?.id||enrollment?.metadata?.self_browser_pilot!==true)return json(res,404,{error:'Not found'});
    const open=await service(`/rest/v1/pilot_enrollments?label=eq.${encodeURIComponent(LABEL)}&status=eq.open&parent_profile_id=is.null&household_id=is.null&student_id=is.null&select=id&order=created_at.desc&limit=2`);
    if(!Array.isArray(open)||open.length!==1||open[0]?.id!==enrollment.id)return json(res,409,{error:'The direct self-pilot requires exactly one matching fresh pilot enrollment.'});
    req.query={...req.query,auto:'1'};
    req.headers={...req.headers,'user-agent':'vercel-cron direct-self-pilot-one-shot'};
    return directHandler(req,res);
  }catch(error){
    console.error('direct self-pilot trigger',error?.message||error);
    if(error?.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));
    const status=Number(error?.status);
    return json(res,status&&status>=400&&status<600?status:500,{error:status&&status<500?error.message:'Unable to start the direct self-pilot.'});
  }
}
