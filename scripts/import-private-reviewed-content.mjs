import {createHash} from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import XLSX from 'xlsx';

const REVIEW_TYPES=['accuracy','alignment','editorial','bias_accessibility','originality'];
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

const workbook=XLSX.readFile(resolvedFile,{cellDates:false}),sheet=workbook.Sheets[workbook.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
if(!rows.length){console.error('Review file has no content rows.');process.exit(2)}
const norm=v=>String(v??'').trim();
const decision=v=>norm(v).toLowerCase();
function stimulus(v){const s=norm(v);if(!s)return null;try{return JSON.parse(s)}catch{return s}}
function answerIndex(v){const s=norm(v).toUpperCase();if(/^[A-D]$/.test(s))return s.charCodeAt(0)-65;const n=Number(s);return Number.isInteger(n)&&n>=0&&n<=3?n:null}
function canonical(row){
 const choices=['choice_a','choice_b','choice_c','choice_d'].map(k=>norm(row[k]));
 const index=answerIndex(row.correct_answer),type=norm(row.content_type),id=norm(row.item_id),exams=norm(row.exam_eligibility).split('|').map(x=>x.trim()).filter(Boolean);
 return{type,id,section:norm(row.section),domain:norm(row.domain),skill:norm(row.skill_key),difficulty:Number(row.difficulty),exams,stimulus:stimulus(row.stimulus),stem:norm(row.stem),choices,answerIndex:index,explanation:norm(row.explanation)};
}
function hash(c){return createHash('sha256').update(JSON.stringify(c)).digest('hex')}
const prepared=[];
for(const [i,row] of rows.entries()){
 const line=i+2,c=canonical(row),expected=norm(row.content_hash).toLowerCase();
 if(!['diagnostic','practice'].includes(c.type))throw new Error(`Row ${line}: invalid content_type.`);
 if(!c.id||!c.stem||!c.explanation||!['RW','MATH'].includes(c.section)||!c.domain||!c.skill||![1,2,3].includes(c.difficulty)||c.answerIndex===null||c.choices.some(x=>!x))throw new Error(`Row ${line}: incomplete or invalid content fields.`);
 const actual=hash(c);if(expected!==actual)throw new Error(`Row ${line}: content hash does not match the exact reviewed item.`);
 for(const type of REVIEW_TYPES)if(decision(row[`${type}_review`])!=='approve')throw new Error(`Row ${line}: ${type} review is not APPROVE.`);
 const reviewer=norm(row.reviewer),reviewedAt=norm(row.reviewed_at);if(!reviewer||!reviewedAt||Number.isNaN(Date.parse(reviewedAt)))throw new Error(`Row ${line}: reviewer and valid reviewed_at are required.`);
 prepared.push({c,hash:actual,reviewer,reviewedAt,notes:norm(row.review_notes)});
}
if(new Set(prepared.map(x=>x.c.id)).size!==prepared.length){console.error('Review file contains duplicate item IDs.');process.exit(2)}

async function rest(route,{method='GET',body,prefer}={}){
 const r=await fetch(`${projectUrl}${route}`,{method,headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 if(!r.ok){const e=new Error(`Supabase content import request failed (${r.status}).`);e.status=r.status;throw e}
 if(r.status===204)return null;const text=await r.text();return text?JSON.parse(text):null;
}

console.log(`Validated ${prepared.length} exact hash-pinned reviewed items. No proprietary question text will be printed.`);
for(const {c,hash:contentHash,reviewer,reviewedAt,notes} of prepared){
 // Fail closed while replacing any existing version: deactivate first, then update prompt/key/reviews,
 // and only reactivate after every write has succeeded.
 await rest(`/rest/v1/content_items?id=eq.${encodeURIComponent(c.id)}`,{method:'PATCH',body:{active:false,updated_at:new Date().toISOString()},prefer:'return=minimal'});
 const item={id:c.id,content_type:c.type,section:c.section,domain_key:c.domain,skill_key:c.skill,difficulty:c.difficulty,format:'mcq',stimulus:c.stimulus,stem:c.stem,choices:c.choices,exams:c.exams.length?c.exams:['SAT','PSAT/NMSQT','PSAT 10'],origin:'satprep_original',qa_status:'production_approved',active:false,updated_at:new Date().toISOString()};
 await rest('/rest/v1/content_items?on_conflict=id',{method:'POST',body:item,prefer:'resolution=merge-duplicates,return=minimal'});
 await rest('/rest/v1/content_answer_keys?on_conflict=item_id',{method:'POST',body:{item_id:c.id,answer:{answerIndex:c.answerIndex},explanation:c.explanation,updated_at:new Date().toISOString()},prefer:'resolution=merge-duplicates,return=minimal'});
 const reviews=REVIEW_TYPES.map(review_type=>({item_id:c.id,review_type,reviewer_label:reviewer,decision:'approve',content_hash:contentHash,notes:notes||null,created_at:new Date(reviewedAt).toISOString()}));
 await rest('/rest/v1/content_item_reviews',{method:'POST',body:reviews,prefer:'return=minimal'});
 if(activate)await rest(`/rest/v1/content_items?id=eq.${encodeURIComponent(c.id)}`,{method:'PATCH',body:{active:true,updated_at:new Date().toISOString()},prefer:'return=minimal'});
 console.log(`${c.id}: imported ${activate?'ACTIVE':'inactive'} with five hash-pinned approvals.`);
}
console.log(`Import complete. ${activate?'Items were activated only after all writes succeeded.':'Items remain inactive; rerun with --activate and the explicit confirmation only after launch QA.'}`);
