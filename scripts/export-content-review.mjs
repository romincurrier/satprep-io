import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {QUESTION_BANK} from '../question-bank-production.js';
import {STAGED_PRACTICE_BANK} from '../practice-bank-v2.js';
import {SKILL_INDEX} from '../sat-spec.js';

const csv=v=>`"${String(v??'').replaceAll('"','""')}"`;
const stimulus=q=>typeof q.stimulus==='string'?q.stimulus:JSON.stringify(q.stimulus??'');
const contentHash=(type,q)=>createHash('sha256').update(JSON.stringify({type,id:q.id,section:q.section,domain:q.domain,skill:q.skill,difficulty:q.difficulty,exams:q.exams||['SAT','PSAT/NMSQT','PSAT 10'],stimulus:q.stimulus??null,stem:q.stem,choices:q.choices||null,answerIndex:q.answerIndex,explanation:q.explanation})).digest('hex');
const row=(type,q)=>[type,q.id,contentHash(type,q),q.section,q.domain,q.skill,SKILL_INDEX[q.skill]?.name,q.difficulty,(q.exams||['SAT','PSAT/NMSQT','PSAT 10']).join('|'),q.status,stimulus(q),q.stem,...(q.choices||['','','','']),String.fromCharCode(65+q.answerIndex),q.explanation,'','','','','','','',''];
const rows=[
 ['content_type','item_id','content_hash','section','domain','skill_key','skill_name','difficulty','exam_eligibility','qa_status','stimulus','stem','choice_a','choice_b','choice_c','choice_d','correct_answer','explanation','accuracy_review','alignment_review','editorial_review','bias_accessibility_review','originality_review','reviewer','reviewed_at','review_notes'],
 ...QUESTION_BANK.map(q=>row('diagnostic',q)),
 ...STAGED_PRACTICE_BANK.map(q=>row('practice',q))
];
await mkdir('artifacts',{recursive:true});
const path='artifacts/content-review.csv';
await writeFile(path,rows.map(r=>r.map(csv).join(',')).join('\n'),'utf8');
console.log(`Wrote ${rows.length-1} review rows to ${path}.`);
console.log('The content_hash binds each review decision to the exact question/version reviewed.');
console.log('Independent reviewers should mark each review column APPROVE / REVISE / REJECT, identify the reviewer/date, and add notes when useful. Do not promote an item until the completed file passes content:review-validate.');
