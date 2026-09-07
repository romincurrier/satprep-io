// Exercise the real diagnostic core against an offline service double.
// No browser, network, Auth account, commercial content, or live database is used.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {databaseReviewContent} from '../content-integrity.js';
import {scoreDiagnosticAnswer} from '../server/diagnostic-core.js';

const originalFetch=globalThis.fetch;
const envNames=['VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'];
const originalEnv=Object.fromEntries(envNames.map(name=>[name,process.env[name]]));
const student={id:'fixture-student'};
const item={id:'fixture-diagnostic',content_type:'diagnostic',section:'MATH',domain_key:'algebra',skill_key:'linear-equations-one-variable',difficulty:1,format:'mcq',stem:'Offline fixture: what is 2 + 2?',stimulus:null,choices:['4','5','6','7'],exams:['SAT']};
const key={item_id:item.id,answer:{answerIndex:0},explanation:'Offline fixture: 2 + 2 = 4.'};
const hash=createHash('sha256').update(JSON.stringify(databaseReviewContent('diagnostic',item,key))).digest('hex');
const reviews=['accuracy','alignment','editorial','bias_accessibility','originality'].map(review_type=>({item_id:item.id,review_type,reviewer_label:'Offline fixture, not a human approval',decision:'approve',content_hash:hash}));
const attempt={id:'fixture-attempt',student_id:student.id,status:'in_progress',summary:{engine:'secure-v3',question_plan:[item.id]}};
const response={question_key:item.id,content_item_id:item.id,skill_key:item.skill_key,is_correct:true,scored_by_server:true};
const submissions=[];
let finalization='refused',finalizationCalls=0;
const reply=body=>new Response(JSON.stringify(body),{status:200});
try{
 process.env.VITE_SUPABASE_URL='https://diagnostic-fixture.invalid';
 process.env.VITE_SUPABASE_ANON_KEY='offline-fixture';
 process.env.SUPABASE_SERVICE_ROLE_KEY='offline-fixture';
 globalThis.fetch=async(input,options={})=>{
  const url=new URL(input);assert.equal(url.origin,'https://diagnostic-fixture.invalid','Test must never access the network.');
  const path=url.pathname,body=options.body?JSON.parse(options.body):null;
  if(path.endsWith('/rpc/submit_diagnostic_response_secure_v3')){submissions.push(body);return reply([{accepted:true,answered:1,total:1,idempotent:submissions.length>1}]);}
  if(path.endsWith('/rpc/finalize_diagnostic_attempt_secure_v3')){finalizationCalls++;return reply(finalization==='empty'?[]:[{completed:finalization==='confirmed'}]);}
  const table=path.split('/').at(-1);
  if(table==='diagnostic_attempts')return reply([attempt]);
  if(table==='diagnostic_attempt_items')return reply([{item_id:item.id}]);
  if(table==='content_items')return reply([item]);
  if(table==='content_answer_keys')return reply([key]);
  if(table==='content_item_reviews')return reply(reviews);
  if(table==='diagnostic_responses')return reply(finalization==='missing-response'?[]:[response]);
  throw new Error(`Unexpected offline service request: ${path}`);
 };
 const submit=()=>scoreDiagnosticAnswer(student,attempt.id,0,0,1000);
 const rejectsUnconfirmed=()=>assert.rejects(submit,error=>error.status===503&&/finaliz|complete/i.test(error.message),'Unconfirmed finalization must remain recoverable and must never report completed:true.');
 await rejectsUnconfirmed();
 assert.equal(finalizationCalls,1,'The explicit finalization refusal must be consulted.');
 finalization='confirmed';
 const confirmed=await submit();
 assert.equal(confirmed.completed,true);
 assert.equal(confirmed.idempotent,true,'Retrying the saved last answer must preserve idempotency.');
 assert.deepEqual(submissions[1],submissions[0],'Recovery must replay the same scoring mutation.');
 finalization='empty';
 await rejectsUnconfirmed();
 finalization='missing-response';
 const callsBefore=finalizationCalls;
 await rejectsUnconfirmed();
 assert.equal(finalizationCalls,callsBefore,'Missing durable response evidence must fail before the finalization RPC.');
 console.log('Diagnostic completion confirmation behavior passed: false/empty finalization and incomplete evidence fail safely; exact-answer retry succeeds.');
}finally{
 globalThis.fetch=originalFetch;
 for(const name of envNames){if(originalEnv[name]===undefined)delete process.env[name];else process.env[name]=originalEnv[name];}
}
