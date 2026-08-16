import { supabase } from "./supabase.js";

function looksLikeEmailVerificationReturn(){
  const params=new URLSearchParams(location.search);
  const hash=new URLSearchParams((location.hash||"").replace(/^#/,""));
  return params.get("verified")==="1" || params.has("code") || params.has("token_hash") || params.get("type")==="signup" || hash.get("type")==="signup" || hash.has("access_token");
}

async function routeVerifiedAccount(){
  if(!looksLikeEmailVerificationReturn()) return;
  for(let i=0;i<20;i++){
    const {data:{session}}=await supabase.auth.getSession();
    if(session){
      const {data:profile}=await supabase.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
      if(profile?.role==="parent"){
        location.replace("/?app=1&onboarding=child");
        return;
      }
      if(profile?.role==="student"){
        location.replace("/?app=1");
        return;
      }
    }
    await new Promise(r=>setTimeout(r,150));
  }
}

routeVerifiedAccount();
