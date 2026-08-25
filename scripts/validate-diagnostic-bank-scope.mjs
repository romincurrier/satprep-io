import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const core=fs.readFileSync(path.join(root,'server/diagnostic-core.js'),'utf8');
const errors=[];
const fail=message=>errors.push(message);

if(!/const REVIEW_FETCH_CHUNK=40;/.test(core))fail('Secure diagnostic review reads must use a bounded candidate-ID chunk size.');
if(!/function candidateIdFilter\(rows\)/.test(core))fail('Secure diagnostic must construct review filters only from candidate diagnostic item IDs.');
if(!/async function scopedReviewMaterial\(candidates\)/.test(core))fail('Secure diagnostic must load scoring/review material through the scoped candidate loader.');
if(!/content_answer_keys\?select=item_id,answer,explanation&item_id=in\.\$\{itemFilter\}/.test(core))fail('Secure diagnostic answer-key reads must be scoped to candidate item IDs.');
if(!/content_item_reviews\?select=id,item_id,review_type,reviewer_label,decision,content_hash,created_at&order=created_at\.asc,id\.asc&item_id=in\.\$\{itemFilter\}/.test(core))fail('Secure diagnostic review reads must be scoped to candidate item IDs while preserving ordered review history.');

const start=core.indexOf('async function approvedRuntimeBank');
const end=core.indexOf('async function approvedContent');
if(start<0||end<=start)fail('Could not locate the secure diagnostic runtime-bank loader.');
else{
 const bank=core.slice(start,end);
 if(!/const candidates=\(items\|\|\[\]\)\.filter/.test(bank))fail('Secure diagnostic must filter eligible exam/content candidates before loading scoring material.');
 if(!/if\(!candidates\.length\)return\[\];/.test(bank))fail('Secure diagnostic must avoid scoring/review reads when no eligible candidates exist.');
 if(!/scopedReviewMaterial\(candidates\)/.test(bank))fail('Secure diagnostic runtime bank must use the scoped scoring/review loader.');
 if(/content_answer_keys\?select=item_id,answer,explanation['"`]/.test(bank))fail('Secure diagnostic runtime bank must not perform a full answer-key table scan.');
 if(/content_item_reviews\?select=id,item_id,review_type,reviewer_label,decision,content_hash,created_at&order=created_at\.asc,id\.asc['"`]/.test(bank))fail('Secure diagnostic runtime bank must not perform a full review-table scan.');
}

if(errors.length){
 console.error(`Diagnostic bank-scope validation failed (${errors.length}):`);
 for(const error of errors)console.error(`- ${error}`);
 process.exit(1);
}
console.log('Diagnostic bank-scope validation passed.');
