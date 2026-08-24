import {json,studentContext} from '../server/supabase-server.js';
import {scoreDiagnosticAnswer} from '../server/diagnostic-core.js';

export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const ctx=await studentContext(req);if(!ctx?.user)return json(res,401,{error:'Sign in to continue.'});if(ctx.profile?.role!=='student'||!ctx.student)return json(res,403,{error:'A student account is required.'});const{attempt_id,position,selected_answer,response_ms}=req.body||{};if(!attempt_id)return json(res,400,{error:'Diagnostic attempt is required.'});const result=await scoreDiagnosticAnswer(ctx.student,String(attempt_id),Number(position),selected_answer,response_ms);return json(res,200,result);
 }catch(e){console.error('diagnostic-answer-v3',e);return json(res,e.status||500,{error:e.status&&e.status<500?e.message:'Unable to save this diagnostic answer.'})}
}
