// First-party public-site measurement only. This module intentionally uses no cookies,
// localStorage, user/account IDs, test scores, age, school information, or persistent IDs.
// Activate only after the marketing_events migration and privacy launch review are complete.

const UTM=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
const clean=(v,max=140)=>{const s=String(v||'').trim().replace(/[\u0000-\u001f\u007f]/g,'');return s?s.slice(0,max):null};
function campaign(){const p=new URLSearchParams(location.search),out={};for(const k of UTM)out[k]=clean(p.get(k));return out}
function referrerHost(){if(!document.referrer)return null;try{return new URL(document.referrer).hostname.slice(0,160)}catch{return null}}
async function send(eventName,extra={}){const body={event_name:eventName,page_path:location.pathname||'/',referrer_host:referrerHost(),...campaign(),cta_key:clean(extra.cta_key,80),section_key:clean(extra.section_key,80)};try{await fetch('/api/marketing-event',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify(body)})}catch{/* analytics must never block product use */}}
export function trackMarketingEvent(eventName,extra){return send(eventName,extra)}
export function installMarketingTracking(){send('marketing_page_view');document.addEventListener('click',e=>{const el=e.target.closest?.('[data-track-cta]');if(!el)return;send('marketing_cta_click',{cta_key:el.dataset.trackCta,section_key:el.dataset.trackSection})},{capture:true});const pricing=document.querySelector('#pricing,[data-marketing-section="pricing"]');if(pricing&&'IntersectionObserver'in window){let sent=false;const o=new IntersectionObserver(entries=>{if(!sent&&entries.some(x=>x.isIntersecting)){sent=true;send('pricing_view',{section_key:'pricing'});o.disconnect()}},{threshold:.35});o.observe(pricing)}}
