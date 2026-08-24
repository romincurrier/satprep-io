import {buildDiagnosticPlan,validateDiagnosticPlan} from '../diagnostic-blueprint.js';
import {SKILL_INDEX,examKey} from '../sat-spec.js';
import {service} from './supabase-server.js';

const LEGACY_TO_OFFICIAL={
 'Analysis':'inferences','Inference':'inferences','Reading Comprehension':'central-ideas-details','Evidence':'command-evidence-textual','Precision':'words-in-context','Vocabulary':'words-in-context','Words in Context':'words-in-context','Organization':'rhetorical-synthesis','Purpose':'rhetorical-synthesis','Style':'rhetorical-synthesis','Rhetorical Synthesis':'rhetorical-synthesis','Writing Mechanics':'form-structure-sense','Grammar':'form-structure-sense','Punctuation':'boundaries','Transitions':'transitions','Linear Equations':'linear-equations-one-variable','Systems':'systems-linear-equations','Functions':'linear-functions','Quadratics':'nonlinear-equations-one-variable','Percent':'percentages','Rates':'ratios-rates-units','Ratios':'ratios-rates-units','Data Analysis':'one-variable-data','Problem Solving':'ratios-rates-units','Geometry':'lines-angles-triangles','Fractions & Decimals':'ratios-rates-units','Number Sense':'ratios-rates-units'
};
const REQUIRED_REVIEWS=['accuracy','alignment','editorial','bias_accessibility'];
let contentSystemReadyCache=null;
function officialSkill(value){const s=String(value||'');return SKILL_INDEX[s]?s:(LEGACY_TO_OFFICIAL[s]||null)}
function examLabel(value){const k=examKey(value);return k==='SAT'?'SAT':k==='PSAT_10'?'PSAT 10':'PSAT/NMSQT'}
function secureAttempt(attempt){const ids=attempt?.summary?.question_plan;return attempt?.summary?.engine==='secure-v3'&&Array.isArray(ids)&&ids.length>0}
function normalizeContentItem(row){return{id:row.id,section:row.section,domain:row.domain_key,skill:row.skill_key,difficulty:Number(row.difficulty),format:row.format,stimulus:row.stimulus||null,stem:row.stem,choices:Array.isArray(row.choices)?row.choices:null,exams:Array.isArray(row.exams)?row.exams:[],estimatedSeconds:Number(row.estimated_seconds)||null}}
function latestReviewMap(reviews){const map=new Map();for(const r of reviews||[]){if(!r.item_id||!REQUIRED_REVIEWS.includes(r.review_type))continue;const byType=map.get(r.item_id)||new Map();byType.set(r.review_type,r);map.set(r.item_id,byType)}return map}
function reviewsApproved(reviewMap,itemId){return REQUIRED_REVIEWS.every(type=>{const r=reviewMap.get(itemId)?.get(type);return r?.decision==='approve'&&!!String(r.reviewer_label||'').trim()})}
export function studentPriorities(student){const path=student?.recommended_path||{},raw=path.external_priority_skills||path.priority_skills||[];return raw.map(x=>({skill:officialSkill(x.skill||x.source_skill),mastery:Number(x.mastery??1)})).filter(x=>x.skill).sort((a,b)=>a.mastery-b.mastery)}
async function contentSystemReady(){
 if(contentSystemReadyCache!==null)return contentSystemReadyCache;
 try{
  await service('/rest/v1/content_items?select=id,qa_status,active&limit=1');
  await service('/rest/v1/content_answer_keys?select=item_id&limit=1');
  await service('/rest/v1/content_item_reviews?select=item_id,review_type,decision&limit=1');
  await service('/rest/v1/diagnostic_attempt_items?select=attempt_id,item_id&limit=1');
  await service('/rest/v1/diagnostic_responses?select=content_item_id,scored_by_server&limit=1');
  contentSystemReadyCache=true;
 }catch(e){
  if(e.status===400||e.status===404){contentSystemReadyCache=false;return false}
  throw e;
 }
 return contentSystemReadyCache;
}
async function approvedRuntimeBank(targetExam){
 const exam=examLabel(targetExam);
 const [items,keys,reviews]=await Promise.all([
  service('/rest/v1/content_items?qa_status=eq.production_approved&active=eq.true&format=eq.mcq&select=id,section,domain_key,skill_key,difficulty,format,stimulus,stem,choices,exams,estimated_seconds&order=id.asc'),
  service('/rest/v1/content_answer_keys?select=item_id'),
  service('/rest/v1/content_item_reviews?select=item_id,review_type,reviewer_label,decision,created_at&order=created_at.asc')
 ]);
 const keyed=new Set((keys||[]).map(x=>x.item_id)),reviewMap=latestReviewMap(reviews);
 return (items||[]).filter(row=>keyed.has(row.id)&&reviewsApproved(reviewMap,row.id)&&Array.isArray(row.exams)&&row.exams.includes(exam)&&SKILL_INDEX[row.skill_key]).map(normalizeContentItem);
}
async function reviewStateApproved(itemId){const rows=await service(`/rest/v1/content_item_reviews?item_id=eq.${encodeURIComponent(itemId)}&select=item_id,review_type,reviewer_label,decision,created_at&order=created_at.asc`);return reviewsApproved(latestReviewMap(rows),itemId)}
async function approvedItem(itemId){const rows=await service(`/rest/v1/content_items?id=eq.${encodeURIComponent(itemId)}&qa_status=eq.production_approved&active=eq.true&format=eq.mcq&select=id,section,domain_key,skill_key,difficulty,format,stimulus,stem,choices,exams,estimated_seconds&limit=1`),item=rows?.[0];if(!item||!(await reviewStateApproved(itemId)))throw Object.assign(new Error('This assessment item is not currently approved for use.'),{status:503});return normalizeContentItem(item)}
async function scoringKey(itemId){const rows=await service(`/rest/v1/content_answer_keys?item_id=eq.${encodeURIComponent(itemId)}&select=answer&limit=1`),raw=rows?.[0]?.answer;const n=typeof raw==='number'?raw:Number(raw?.answerIndex??raw?.index);if(!Number.isInteger(n)||n<0||n>3)throw Object.assign(new Error('The approved scoring key is not ready.'),{status:503});return n}
async function assertPersistedPlanItem(attemptId,position,itemId){const rows=await service(`/rest/v1/diagnostic_attempt_items?attempt_id=eq.${encodeURIComponent(attemptId)}&position=eq.${Number(position)}&select=item_id&limit=1`);if(rows?.[0]?.item_id!==itemId)throw Object.assign(new Error('The secure assessment plan could not be verified.'),{status:503})}
export async function latestOpenAttempt(studentId){const rows=await service(`/rest/v1/diagnostic_attempts?student_id=eq.${encodeURIComponent(studentId)}&status=neq.completed&select=id,status,started_at,summary&order=started_at.desc&limit=1`);return rows?.[0]||null}
export async function responseCount(attemptId,{serverScored=false}={}){const filter=serverScored?'&scored_by_server=eq.true':'';const rows=await service(`/rest/v1/diagnostic_responses?attempt_id=eq.${encodeURIComponent(attemptId)}${filter}&select=question_key`);return new Set((rows||[]).map(r=>r.question_key)).size}
export async function ensureSecureAttempt(student){
 const existing=await latestOpenAttempt(student.id);
 if(existing){
  if(!secureAttempt(existing))return{attempt:existing,legacy:true,total:existing.summary?.question_plan?.length||0,completed:await responseCount(existing.id)};
  if(!(await contentSystemReady()))throw Object.assign(new Error('The secure diagnostic content system is not ready.'),{status:503});
  const bank=await approvedRuntimeBank(student.target_exam||'SAT'),approved=new Set(bank.map(x=>x.id)),ids=existing.summary?.question_plan||[];
  if(!ids.every(id=>approved.has(id)))throw Object.assign(new Error('This pre-launch diagnostic uses content that is not currently production-approved. Your saved progress has not been altered.'),{status:503});
  return{attempt:existing,legacy:false,total:ids.length,completed:await responseCount(existing.id,{serverScored:true})};
 }
 if(student.diagnostic_completed_at)return{completedDiagnostic:true};
 if(!(await contentSystemReady()))throw Object.assign(new Error('The secure diagnostic content system is not ready.'),{status:503});
 const bank=await approvedRuntimeBank(student.target_exam||'SAT');
 const priorities=studentPriorities(student),seed=`${student.id}:${new Date().toISOString().slice(0,10)}`,plan=buildDiagnosticPlan({targetExam:student.target_exam||'SAT',priorities,seed,bank}),planErrors=validateDiagnosticPlan(plan);
 if(planErrors.length)throw Object.assign(new Error('The independently reviewed diagnostic bank is not deep enough for a complete assessment yet.'),{status:503});
 const ids=plan.map(x=>x.itemId),summary={engine:'secure-v3',adaptive:true,assessment_only:true,question_plan:ids,blueprint:plan,external_priorities:priorities,content_version:'db-approved-v1'};
 const rows=await service('/rest/v1/diagnostic_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({student_id:student.id,status:'in_progress',summary})});
 const attempt=rows?.[0];if(!attempt)throw new Error('Diagnostic attempt could not be created.');
 try{await service('/rest/v1/diagnostic_attempt_items',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(plan.map(x=>({attempt_id:attempt.id,position:x.position,item_id:x.itemId,module:x.position<Math.ceil(plan.length/2)?1:2,is_targeted:!!x.isTargeted})))})}catch(e){await service(`/rest/v1/diagnostic_attempts?id=eq.${encodeURIComponent(attempt.id)}`,{method:'DELETE'}).catch(()=>{});throw e}
 return{attempt,legacy:false,total:ids.length,completed:0};
}
export async function ownedAttempt(studentId,attemptId){const rows=await service(`/rest/v1/diagnostic_attempts?id=eq.${encodeURIComponent(attemptId)}&student_id=eq.${encodeURIComponent(studentId)}&select=id,status,started_at,summary`);return rows?.[0]||null}
export function safeQuestion(item,position,total){return{id:item.id,position,total,section:item.section,domain:item.domain,skill:item.skill,difficulty:item.difficulty,format:item.format,stimulus:item.stimulus||null,stem:item.stem,choices:item.choices||null,estimatedSeconds:item.estimatedSeconds}}
function planPosition(attempt,position){const ids=attempt.summary?.question_plan||[];if(!secureAttempt(attempt))throw Object.assign(new Error('This diagnostic uses the legacy assessment engine.'),{status:409});const p=Number(position);if(!Number.isInteger(p)||p<0||p>=ids.length)throw Object.assign(new Error('Question position is invalid.'),{status:400});return{ids,p,itemId:ids[p]}}
export async function questionForAttempt(studentId,attemptId,position,{enforceCurrent=false}={}){const attempt=await ownedAttempt(studentId,attemptId);if(!attempt)throw Object.assign(new Error('Diagnostic attempt not found.'),{status:404});if(attempt.status==='completed')throw Object.assign(new Error('This diagnostic is already complete.'),{status:409});const{ids,p,itemId}=planPosition(attempt,position);if(enforceCurrent){const answered=await responseCount(attemptId,{serverScored:true});if(p!==answered)throw Object.assign(new Error(`Continue from question ${Math.min(answered+1,ids.length)}.`),{status:409})}await assertPersistedPlanItem(attemptId,p,itemId);const item=await approvedItem(itemId);return{attempt,item,question:safeQuestion(item,p,ids.length)}}
async function existingResponse(attemptId,itemId){const rows=await service(`/rest/v1/diagnostic_responses?attempt_id=eq.${encodeURIComponent(attemptId)}&question_key=eq.${encodeURIComponent(itemId)}&scored_by_server=eq.true&select=question_key,content_item_id,selected_answer,is_correct,scored_by_server&limit=1`);return rows?.[0]||null}
export async function scoreDiagnosticAnswer(student,attemptId,position,selectedAnswer,responseMs){const attempt=await ownedAttempt(student.id,attemptId);if(!attempt)throw Object.assign(new Error('Diagnostic attempt not found.'),{status:404});if(attempt.status==='completed')return{ok:true,completed:true};if(!(await contentSystemReady()))throw Object.assign(new Error('The secure diagnostic content system is not ready.'),{status:503});const{ids,p,itemId}=planPosition(attempt,position),selected=Number(selectedAnswer);if(!Number.isInteger(selected)||selected<0||selected>3)throw Object.assign(new Error('Selected answer is invalid.'),{status:400});await assertPersistedPlanItem(attemptId,p,itemId);const item=await approvedItem(itemId),correctIndex=await scoringKey(item.id);
 const prior=await existingResponse(attemptId,item.id);if(prior){if(Number(prior.selected_answer)!==selected)throw Object.assign(new Error('This question was already submitted and cannot be changed.'),{status:409});const count=await responseCount(attemptId,{serverScored:true}),completed=count>=ids.length;if(completed)await finalizeSecureDiagnostic(student,attempt);return{ok:true,completed,nextPosition:completed?null:count,answered:count,total:ids.length,idempotent:true}}
 const answeredBefore=await responseCount(attemptId,{serverScored:true});if(p!==answeredBefore)throw Object.assign(new Error(`Continue from question ${Math.min(answeredBefore+1,ids.length)}.`),{status:409});const isCorrect=selected===correctIndex;
 try{await service('/rest/v1/diagnostic_responses',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({attempt_id:attemptId,student_id:student.id,question_key:item.id,content_item_id:item.id,domain:item.domain,skill_key:item.skill,difficulty:item.difficulty,selected_answer:selected,correct_answer:selected,is_correct:isCorrect,response_ms:Math.max(0,Math.min(3600000,Number(responseMs)||0)),scored_by_server:true})})}catch(e){if(e.status!==409)throw e;const raced=await existingResponse(attemptId,item.id);if(!raced||Number(raced.selected_answer)!==selected)throw e}
 const total=ids.length,count=await responseCount(attemptId,{serverScored:true}),completed=count>=total;if(completed)await finalizeSecureDiagnostic(student,attempt);return{ok:true,completed,nextPosition:completed?null:count,answered:count,total}}
async function finalizeSecureDiagnostic(student,attempt){const rows=await service(`/rest/v1/diagnostic_responses?attempt_id=eq.${encodeURIComponent(attempt.id)}&scored_by_server=eq.true&content_item_id=not.is.null&select=question_key,content_item_id,skill_key,is_correct,scored_by_server`),ids=attempt.summary?.question_plan||[],allowed=new Set(ids),byQuestion=new Map();for(const r of rows||[])if(allowed.has(r.question_key)&&r.content_item_id===r.question_key&&r.scored_by_server===true&&!byQuestion.has(r.question_key))byQuestion.set(r.question_key,r);const responses=[...byQuestion.values()];if(responses.length<ids.length)return false;const bySkill={},section={RW:{right:0,total:0},MATH:{right:0,total:0}};for(const r of responses){const meta=SKILL_INDEX[r.skill_key];if(!meta)continue;section[meta.section].total++;if(r.is_correct)section[meta.section].right++;bySkill[r.skill_key]??={right:0,total:0,domain:meta.domainKey,section:meta.section};bySkill[r.skill_key].total++;if(r.is_correct)bySkill[r.skill_key].right++}
 const frac=x=>x.total?x.right/x.total:0,mathScore=frac(section.MATH),rwScore=frac(section.RW),overall=(mathScore+rwScore)/2,ranked=Object.entries(bySkill).map(([skill,v])=>({skill,domain:v.domain,section:v.section,mastery:v.right/v.total,items:v.total})).sort((a,b)=>a.mastery-b.mastery),now=new Date().toISOString(),diag={...attempt.summary,priority_skills:ranked.slice(0,8),strengths:[...ranked].sort((a,b)=>b.mastery-a.mastery).slice(0,5),diagnostic_version:'secure-v3',completed_at:now},recommended=overall>=.8?'Accelerated SAT/PSAT Path':overall>=.55?'Core SAT/PSAT Path':'Foundation-Building Path';
 await service(`/rest/v1/diagnostic_attempts?id=eq.${encodeURIComponent(attempt.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'completed',completed_at:now,math_score:mathScore,rw_score:rwScore,overall_score:overall,recommended_start:recommended,summary:diag})});
 const current=student.recommended_path&&typeof student.recommended_path==='object'?student.recommended_path:{},merged={...current,diagnostic:diag,diagnostic_priority_skills:diag.priority_skills,diagnostic_strengths:diag.strengths,diagnostic_completed_at:now};await service(`/rest/v1/students?id=eq.${encodeURIComponent(student.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({diagnostic_completed_at:now,diagnostic_math_mastery:mathScore,diagnostic_rw_mastery:rwScore,recommended_path:merged,onboarding_complete:true})});
 for(const x of ranked)await service('/rest/v1/skill_mastery?on_conflict=student_id,skill_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({student_id:student.id,skill_key:x.skill,mastery:x.mastery,items_attempted:x.items,updated_at:now})});return true}
export async function bankMetadata(targetExam='SAT'){if(!(await contentSystemReady()))return{items:0,productionApproved:0,ready:false};const bank=await approvedRuntimeBank(targetExam);return{items:bank.length,productionApproved:bank.length,ready:bank.length>=20}}
