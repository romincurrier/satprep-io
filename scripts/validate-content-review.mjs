import fs from 'node:fs';
import {createHash} from 'node:crypto';
import XLSX from 'xlsx';
import {QUESTION_BANK} from '../question-bank-production.js';
import {STAGED_PRACTICE_BANK} from '../practice-bank-v2.js';
import {canonicalReviewContent} from '../content-integrity.js';

const input=process.argv[2]||'artifacts/content-review.csv';
const hash=(type,q)=>createHash('sha256').update(JSON.stringify(canonicalReviewContent(type,q))).digest('hex');
const expected=new Map([
 ...QUESTION_BANK.map(q=>[`diagnostic:${q.id}`,{type:'diagnostic',q,hash:hash('diagnostic',q)}]),
 ...STAGED_PRACTICE_BANK.map(q=>[`practice:${q.id}`,{type:'practice',q,hash:hash('practice',q)}])
]);
const reviews=['accuracy_review','alignment_review','editorial_review','bias_accessibility_review','originality_review'];
const allowed=new Set(['APPROVE','REVISE','REJECT']);
const errors=[],revisions=[],rejections=[],approved=[];
if(!fs.existsSync(input)){console.error(`Review file not found: ${input}`);process.exit(1)}
const workbook=XLSX.readFile(input,{cellDates:false});
const sheet=workbook.Sheets[workbook.SheetNames[0]];
const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
const seen=new Set();
for(const [i,row] of rows.entries()){
 const type=String(row.content_type||'').trim(),id=String(row.item_id||'').trim(),key=`${type}:${id}`;
 if(!expected.has(key)){errors.push(`Row ${i+2}: unknown item ${key}`);continue}
 if(seen.has(key)){errors.push(`Row ${i+2}: duplicate review row ${key}`);continue}seen.add(key);
 const exp=expected.get(key),gotHash=String(row.content_hash||'').trim();
 if(gotHash!==exp.hash){errors.push(`${key}: content hash does not match current source; re-export and review the current item.`);continue}
 const reviewer=String(row.reviewer||'').trim(),reviewedAt=String(row.reviewed_at||'').trim();
 if(!reviewer)errors.push(`${key}: reviewer is required.`);
 if(!reviewedAt||Number.isNaN(Date.parse(reviewedAt)))errors.push(`${key}: reviewed_at must be a valid date/time.`);
 const decisions={};let hasRevise=false,hasReject=false;
 for(const field of reviews){const d=String(row[field]||'').trim().toUpperCase();decisions[field]=d;if(!allowed.has(d))errors.push(`${key}: ${field} must be APPROVE, REVISE, or REJECT.`);if(d==='REVISE')hasRevise=true;if(d==='REJECT')hasReject=true}
 const record={content_type:type,item_id:id,content_hash:exp.hash,reviewer,reviewed_at:reviewedAt,decisions,notes:String(row.review_notes||'').trim()};
 if(hasReject)rejections.push(record);else if(hasRevise)revisions.push(record);else if(reviews.every(f=>decisions[f]==='APPROVE'))approved.push(record);
}
for(const key of expected.keys())if(!seen.has(key))errors.push(`Missing review row: ${key}`);
if(errors.length){for(const e of errors)console.error(`Review validation error: ${e}`);console.error(`Review validation failed with ${errors.length} error(s).`);process.exit(1)}
const output={validated_at:new Date().toISOString(),source_file:input,total:rows.length,approved,revisions,rejections};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/content-review-validation.json',JSON.stringify(output,null,2));
console.log(`Review file is structurally valid: ${approved.length} approved, ${revisions.length} revise, ${rejections.length} reject.`);
console.log('Wrote artifacts/content-review-validation.json. This validation does not automatically promote content to production.');
if(revisions.length||rejections.length)process.exitCode=2;
