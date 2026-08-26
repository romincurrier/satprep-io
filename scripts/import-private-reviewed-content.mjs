import {createHash} from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import XLSX from 'xlsx';
import {canonicalReviewContent} from '../content-integrity.js';
import {sprSpecFrom} from '../server/response-scoring.js';

const REVIEW_TYPES=['accuracy','alignment','editorial','bias_accessibility','originality'];
const MIN_INDEPENDENT_REVIEWERS=3;
const MAX_DIMENSIONS_PER_REVIEWER=2;
const NEAR_DUPLICATE_THRESHOLD=.96;
const EXISTING_PAGE_SIZE=500;
const args=process.argv.slice(2),file=args.find(x=>!x.startsWith('--'));
const activate=args.includes('--activate');
if(!file){console.error('Usage: node scripts/import-private-reviewed-content.mjs /absolute/private/content-review.csv [--activate]');process.exit(2)}
if(!path.isAbsolute(file)){console.error('For safety, provide an absolute path to a private review file outside the public repository.');process.exit(2)}
const resolvedFile=path.resolve(file),repoRoot=path.resolve(process.cwd());
if(resolvedFile===repoRoot||resolvedFile.startsWith(`${repoRoot}${path.sep}`)){console.error('Refusing to import proprietary review content from inside the public repository. Move the file to a private external location first.');process.exit(2)}
const projectUrl=String(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
const serviceKey=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl)||!serviceKey){console.error('SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.');process.exit(2)}
if(activate&&process.env.PRIVATE_CONTENT_IMPORT_CONFIRM!=='ACTIVATE_REVIEWED_CONTENT'){console.error('Activation requires PRIVATE_CONTENT_IMPORT_CONFIRM=ACTIVATE_REVIEWED_CONTENT. Omit --activate to import approved content inactive.');process.exit(2)}

const workbook=XLSX.readFile(resolvedFile,{cellDates:false}),sheet=workbook.Sheets[workbook.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});
if(!rows.length){console.error('Review file has no content rows.');process.exit(2)}
const norm=v=>String(v??'').trim();
const decision=v=>norm(v).toLowerCase();
function stimulus(v){const s=norm(v);if(!s)return null;try{return JSON.parse(s)}catch{return s}}
function answerIndex(v){const s=norm(v).toUpperCase();if(/^[A-D]$/.test(s))return s.charCodeAt(0)-65;const n=Number(s);return Number.isInteger(n)&&n>=0&&n<=3?n:null}
function parsedRow(row){
 const type=norm(row.content_type),id=norm(row.item_id),section=norm(row.section),format=(norm(row.response_format)||'mcq').toLowerCase(),exams=norm(row.exam_eligibility).split('|').map(x=>x.trim()).filter(Boolean),choices=['choice_a','choice_b','choice_c','choice_d'].map(k=>norm(row[k]));
 const base={type,id,section,domain:norm(row.domain),skill:norm(row.skill_key),difficulty:Number(row.difficulty),format,exams,stimulus:stimulus(row.stimulus),stem:norm(row.stem),choices:format==='mcq'?choices:null,explanation:norm(row.explanation)};
 if(format==='mcq')return{...base,answerIndex:answerIndex(row.correct_answer)};
 const accepted=norm(row.accepted_answers).split('|').map(x=>x.trim()).filter(Boolean),display=norm(row.correct_answer)||accepted[0]||'';
 return{...base,answer:{accepted,display}};
}
function hash(c){return createHash('sha256').update(JSON.stringify(canonicalReviewContent(c.type,c))).digest('hex')}
function compact(v){return norm(v).normalize('NFKC').toLowerCase().replace(/\s+/g,' ')}
function duplicateSignature(c){return createHash('sha256').update(JSON.stringify({section:c.section,skill:c.skill,format:c.format,stimulus:compact(typeof c.stimulus==='string'?c.stimulus:JSON.stringify(c.stimulus??'')),stem:compact(c.stem),choices:(c.choices||[]).map(compact)})).digest('hex')}
function similarityTokens(c){return compact([typeof c.stimulus==='string'?c.stimulus:JSON.stringify(c.stimulus??''),c.stem,...(c.choices||[])].join(' ')).replace(/[^\p{L}\p{N}]+/gu,' ').split(' ').filter(Boolean)}
function tokenJaccard(a,b){const A=new Set(a),B=new Set(b);if(!A.size||!B.size)return 0;let common=0;for(const token of A)if(B.has(token))common++;return common/(A.size+B.size-common)}
function nearDuplicate(a,b){if(a.section!==b.section||a.skill!==b.skill||a.format!==b.format)return false;const A=similarityTokens(a),B=similarityTokens(b);if(Math.min(A.length,B.length)<12)return false;return tokenJaccard(A,B)>=NEAR_DUPLICATE_THRESHOLD}
function reviewDetails(row,line){
 const commonReviewedAt=norm(row.reviewed_at),details={};
 for(const type of REVIEW_TYPES){
  if(decision(row[`${type}_review`])!=='approve')throw new Error(`Row ${line}: ${type} review is not APPROVE.`);
  const reviewer=norm(row[`${type}_reviewer`]||row.reviewer),reviewedAt=norm(row[`${type}_reviewed_at`]||commonReviewedAt);
  if(!reviewer)throw new Error(`Row ${line}: ${type}_reviewer is required for independent commercial review.`);
  if(!reviewedAt||Number.isNaN(Date.parse(reviewedAt)))throw new Error(`Row ${line}: ${type}_reviewed_at (or reviewed_at) must be a valid date/time.`);
  details[type]={reviewer,reviewedAt:new Date(reviewedAt).toISOString()};
 }
 const counts=new Map();
 for(const type of REVIEW_TYPES){const label=details[type].reviewer.toLowerCase();counts.set(label,(counts.get(label)||0)+1)}
 if(counts.size<MIN_INDEPENDENT_REVIEWERS)throw new Error(`Row ${line}: commercial approval requires at least ${MIN_INDEPENDENT_REVIEWERS} distinct reviewers across the five review dimensions.`);
 if(Math.max(...counts.values())>MAX_DIMENSIONS_PER_REVIEWER)throw new Error(`Row ${line}: no reviewer may approve more than ${MAX_DIMENSIONS_PER_REVIEWER} review dimensions for the same item.`);
 return details;
}

const prepared=[];
for(const [i,row] of rows.entries()){
 const line=i+2,c=parsedRow(row),expected=norm(row.content_hash).toLowerCase();
 if(!['diagnostic','practice'].includes(c.type))throw new Error(`Row ${line}: invalid content_type.`);
 if(!c.id||!c.stem||!c.explanation||!['RW','MATH'].includes(c.section)||!c.domain||!c.skill||![1,2,3].includes(c.difficulty)||!['mcq','spr'].includes(c.format))throw new Error(`Row ${line}: incomplete or invalid content fields.`);
 if(c.format==='mcq'&&(c.answerIndex===null||!Array.isArray(c.choices)||c.choices.length!==4||c.choices.some(x=>!x)))throw new Error(`Row ${line}: MCQ content requires four choices and a valid A-D correct answer.`);
 if(c.format==='spr'){
  if(c.section!=='MATH')throw new Error(`Row ${line}: student-produced response format is valid only for Math content.`);
  if(!sprSpecFrom(c.answer))throw new Error(`Row ${line}: SPR content requires one or more valid accepted_answers and a display answer.`);
 }
 const actual=hash(c);if(expected!==actual)throw new Error(`Row ${line}: content hash does not match the exact reviewed item.`);
 prepared.push({c,hash:actual,reviews:reviewDetails(row,line),notes:norm(row.review_notes)});
}
if(new Set(prepared.map(x=>x.c.id)).size!==prepared.length){console.error('Review file contains duplicate item IDs.');process.exit(2)}
const incomingSignatures=new Map();
for(const entry of prepared){const signature=duplicateSignature(entry.c),prior=incomingSignatures.get(signature);if(prior&&prior!==entry.c.id)throw new Error(`Reviewed import contains duplicate question content under item IDs ${prior} and ${entry.c.id}. Diagnostic and practice banks must remain distinct.`);incomingSignatures.set(signature,entry.c.id)}
for(let i=0;i<prepared.length;i++)for(let j=i+1;j<prepared.length;j++)if(nearDuplicate(prepared[i].c,prepared[j].c))throw new Error(`Reviewed import contains near-duplicate question wording under item IDs ${prepared[i].c.id} and ${prepared[j].c.id}; diversify and re-review before import. Diagnostic and practice banks must remain distinct.`);

async function rest(route,{method='GET',body,prefer}={}){
 const r=await fetch(`${projectUrl}${route}`,{method,headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 if(!r.ok){const e=new Error(`Supabase content import request failed (${r.status}).`);e.status=r.status;throw e}
 if(r.status===204)return null;const text=await r.text();return text?JSON.parse(text):null;
}
async function existingReviewedContent(){const all=[];for(let offset=0;offset<10000;offset+=EXISTING_PAGE_SIZE){const page=await rest(`/rest/v1/content_items?qa_status=eq.production_approved&select=id,content_type,section,skill_key,format,stimulus,stem,choices&order=id.asc&limit=${EXISTING_PAGE_SIZE}&offset=${offset}`)||[];all.push(...page);if(page.length<EXISTING_PAGE_SIZE)return all}throw new Error('Existing reviewed-content scan exceeded the 10,000-item safety limit; update the importer pagination limit before continuing.')}
function existingShape(row){return{type:row.content_type,id:row.id,section:row.section,skill:row.skill_key,format:row.format||'mcq',stimulus:row.stimulus??null,stem:row.stem,choices:Array.isArray(row.choices)?row.choices:null}}
const existing=(await existingReviewedContent()).map(existingShape),existingSignatures=new Map();
for(const item of existing)existingSignatures.set(duplicateSignature(item),item.id);
for(const entry of prepared){const exact=existingSignatures.get(duplicateSignature(entry.c));if(exact&&exact!==entry.c.id)throw new Error(`Item ${entry.c.id}: reviewed content exactly duplicates existing production-approved item ${exact}. Diagnostic and practice banks must remain distinct.`);for(const prior of existing){if(prior.id!==entry.c.id&&nearDuplicate(entry.c,prior))throw new Error(`Item ${entry.c.id}: wording is too similar to existing production-approved item ${prior.id}; diversify and re-review before import. Diagnostic and practice banks must remain distinct.`)}}

console.log(`Validated ${prepared.length} exact hash-pinned reviewed items with at least ${MIN_INDEPENDENT_REVIEWERS} independent reviewers per item and screened them against duplicate/near-duplicate commercial content across diagnostic and practice banks. No proprietary question text will be printed.`);
for(const {c,hash:contentHash,reviews:reviewDetailsByType,notes} of prepared){
 await rest(`/rest/v1/content_items?id=eq.${encodeURIComponent(c.id)}`,{method:'PATCH',body:{active:false,updated_at:new Date().toISOString()},prefer:'return=minimal'});
 const item={id:c.id,content_type:c.type,section:c.section,domain_key:c.domain,skill_key:c.skill,difficulty:c.difficulty,format:c.format,stimulus:c.stimulus,stem:c.stem,choices:c.format==='mcq'?c.choices:null,exams:c.exams.length?c.exams:['SAT','PSAT/NMSQT','PSAT 10'],origin:'satprep_original',qa_status:'production_approved',active:false,updated_at:new Date().toISOString()};
 await rest('/rest/v1/content_items?on_conflict=id',{method:'POST',body:item,prefer:'resolution=merge-duplicates,return=minimal'});
 const answer=c.format==='mcq'?{answerIndex:c.answerIndex}:c.answer;
 await rest('/rest/v1/content_answer_keys?on_conflict=item_id',{method:'POST',body:{item_id:c.id,answer,explanation:c.explanation,updated_at:new Date().toISOString()},prefer:'resolution=merge-duplicates,return=minimal'});
 const reviews=REVIEW_TYPES.map(review_type=>({item_id:c.id,review_type,reviewer_label:reviewDetailsByType[review_type].reviewer,decision:'approve',content_hash:contentHash,notes:notes||null,created_at:reviewDetailsByType[review_type].reviewedAt}));
 await rest('/rest/v1/content_item_reviews',{method:'POST',body:reviews,prefer:'return=minimal'});
 if(activate)await rest(`/rest/v1/content_items?id=eq.${encodeURIComponent(c.id)}`,{method:'PATCH',body:{active:true,updated_at:new Date().toISOString()},prefer:'return=minimal'});
 console.log(`${c.id}: imported ${activate?'ACTIVE':'inactive'} ${c.format.toUpperCase()} with five hash-pinned approvals from an independently reviewed set.`);
}
console.log(`Import complete. ${activate?'Items were activated only after all writes succeeded.':'Items remain inactive; rerun with --activate and the explicit confirmation only after launch QA.'}`);
