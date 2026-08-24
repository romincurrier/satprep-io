import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {QUESTION_BANK} from '../question-bank-production.js';
import {STAGED_PRACTICE_BANK} from '../practice-bank-v2.js';

const registry=JSON.parse(fs.readFileSync('content-approval-registry.json','utf8'));
const canonical=(type,q)=>({type,id:q.id,section:q.section,domain:q.domain,skill:q.skill,difficulty:q.difficulty,exams:q.exams||['SAT','PSAT/NMSQT','PSAT 10'],stimulus:q.stimulus??null,stem:q.stem,choices:q.choices||null,answerIndex:q.answerIndex,explanation:q.explanation});
const hash=(type,q)=>createHash('sha256').update(JSON.stringify(canonical(type,q))).digest('hex');
const expected=new Map([
 ...QUESTION_BANK.map(q=>[`diagnostic:${q.id}`,{type:'diagnostic',q,hash:hash('diagnostic',q)}]),
 ...STAGED_PRACTICE_BANK.map(q=>[`practice:${q.id}`,{type:'practice',q,hash:hash('practice',q)}])
]);
const errors=[];let diagnostic=0,practice=0;
if(registry.version!==1)errors.push('Approval registry version must be 1.');
for(const [key,record] of Object.entries(registry.approvals||{})){
 const exp=expected.get(key);
 if(!exp){errors.push(`${key}: approval references unknown content.`);continue}
 if(record.content_hash!==exp.hash)errors.push(`${key}: approved content changed after review; re-export and re-review this item.`);
 if(!String(record.reviewer||'').trim())errors.push(`${key}: reviewer is missing.`);
 if(!record.reviewed_at||Number.isNaN(Date.parse(record.reviewed_at)))errors.push(`${key}: reviewed_at is invalid.`);
 if(exp.type==='diagnostic')diagnostic++;else practice++;
}
if(errors.length){for(const e of errors)console.error(`Content approval validation error: ${e}`);process.exit(1)}
console.log(`Content approval registry valid: ${diagnostic} diagnostic approval(s), ${practice} practice approval(s).`);
console.log('Approvals remain valid only while the reviewed content hash is unchanged.');
