import { supabase } from './supabase.js';

let busy=false;
async function refreshLearningModel(){
  const params=new URLSearchParams(location.search);if(params.get('app')!=='1'||busy)return;
  const {data:{session}}=await supabase.auth.getSession();if(!session)return;
  busy=true;
  try{
    const response=await fetch('/api/learning-model-v3',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`}});
    const data=await response.json().catch(()=>({}));
    if([401,403].includes(response.status))return;
    if(response.status===429||response.status===503)return;
    if(!response.ok)throw new Error(data.error||'Unable to refresh learning model.');
    if(data.updated)document.dispatchEvent(new CustomEvent('satprep:learning-model-updated',{detail:{model_version:data.model_version||null}}));
  }catch(error){console.warn('learning model refresh deferred',error)}finally{busy=false}
}

setTimeout(refreshLearningModel,700);
supabase.auth.onAuthStateChange(()=>setTimeout(refreshLearningModel,500));
