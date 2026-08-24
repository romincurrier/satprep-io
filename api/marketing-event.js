import {json,service,enforceRateLimit} from '../server/supabase-server.js';

const EVENTS=new Set(['marketing_page_view','marketing_cta_click','pricing_view','signup_open','login_open']);
const MEASUREMENT_ENABLED=String(process.env.MARKETING_MEASUREMENT_ENABLED||'').toLowerCase()==='true';
const EMAIL_LIKE=/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;
const PHONE_LIKE=/(?:\+?\d[\d\s().-]{7,}\d)/;
const clean=(value,max=140)=>{if(value==null)return null;const s=String(value).trim().replace(/[\u0000-\u001f\u007f]/g,'');return s?s.slice(0,max):null};
const noContactData=value=>value&&(EMAIL_LIKE.test(value)||PHONE_LIKE.test(value))?null:value;
const cleanKey=(value,max=80)=>{const s=noContactData(clean(value,max));return s&&/^[a-z0-9_./:-]+$/i.test(s)?s:null};
const cleanFree=(value,max=140)=>noContactData(clean(value,max));
const safePath=value=>{const s=clean(value,240)||'/';if(!s.startsWith('/')||s.startsWith('//'))return'/';return s.split('?')[0].split('#')[0].slice(0,240)||'/'};
const allowedOrigin=req=>{const origin=String(req.headers.origin||'');if(!origin)return true;try{const host=new URL(origin).hostname.toLowerCase();return host==='satprep.io'||host==='www.satprep.io'||host.endsWith('.vercel.app')||host==='localhost'||host==='127.0.0.1'}catch{return false}};
function networkSubject(req){
 // Vercel overwrites x-forwarded-for at the edge, so it is suitable as a short-lived
 // abuse-control subject. The raw address is never written to marketing_events or
 // api_rate_limits; enforceRateLimit hashes it before database storage.
 const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
 const fallback=String(req.socket?.remoteAddress||'').trim();
 return clean(forwarded||fallback||'unknown-network',128)||'unknown-network';
}

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!MEASUREMENT_ENABLED)return json(res,404,{error:'Not found'});
 if(!allowedOrigin(req))return json(res,403,{error:'Origin not allowed'});
 try{
  await enforceRateLimit(networkSubject(req),'marketing/event',{limit:60,windowSeconds:60});
  const raw=req.body&&typeof req.body==='object'?req.body:{};
  if(JSON.stringify(raw).length>3000)return json(res,413,{error:'Event payload is too large'});
  const eventName=cleanKey(raw.event_name,60);if(!EVENTS.has(eventName))return json(res,400,{error:'Unknown event'});
  const row={event_name:eventName,page_path:safePath(raw.page_path),referrer_host:cleanKey(raw.referrer_host,160),utm_source:cleanKey(raw.utm_source,100),utm_medium:cleanKey(raw.utm_medium,100),utm_campaign:cleanKey(raw.utm_campaign,140),utm_content:cleanKey(raw.utm_content,140),utm_term:cleanFree(raw.utm_term,140),cta_key:cleanKey(raw.cta_key,80),section_key:cleanKey(raw.section_key,80)};
  await service('/rest/v1/marketing_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(row)});
  return json(res,202,{accepted:true});
 }catch(e){console.error('marketing-event',e);if(e.retryAfter)res.setHeader('Retry-After',String(e.retryAfter));const status=Number(e.status);return json(res,status&&status<500?status:503,{error:status&&status<500?e.message:'Measurement unavailable'})}
}
