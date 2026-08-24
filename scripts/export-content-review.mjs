import {mkdir,writeFile} from 'node:fs/promises';
import {QUESTION_BANK} from '../question-bank-production.js';
import {STAGED_PRACTICE_BANK} from '../practice-bank-v2.js';
import {SKILL_INDEX} from '../sat-spec.js';

const csv=v=>`"${String(v??'').replaceAll('"','""')}"`;
const stimulus=q=>typeof q.stimulus==='string'?q.stimulus:JSON.stringify(q.stimulus??'');
const rows=[
 ['content_type','item_id','section','domain','skill_key','skill_name','difficulty','exam_eligibility','qa_status','stimulus','stem','choice_a','choice_b','choice_c','choice_d','correct_answer','explanation','accuracy_review','alignment_review','editorial_review','bias_accessibility_review','originality_review','review_notes'],
 ...QUESTION_BANK.map(q=>['diagnostic',q.id,q.section,q.domain,q.skill,SKILL_INDEX[q.skill]?.name,q.difficulty,(q.exams||['SAT','PSAT/NMSQT','PSAT 10']).join('|'),q.status,stimulus(q),q.stem,...(q.choices||['','','','']),String.fromCharCode(65+q.answerIndex),q.explanation,'','','','','','']),
 ...STAGED_PRACTICE_BANK.map(q=>['practice',q.id,q.section,q.domain,q.skill,SKILL_INDEX[q.skill]?.name,q.difficulty,(q.exams||['SAT','PSAT/NMSQT','PSAT 10']).join('|'),q.status,stimulus(q),q.stem,...(q.choices||['','','','']),String.fromCharCode(65+q.answerIndex),q.explanation,'','','','','',''])
];
await mkdir('artifacts',{recursive:true});
const path='artifacts/content-review.csv';
await writeFile(path,rows.map(r=>r.map(csv).join(',')).join('\n'),'utf8');
console.log(`Wrote ${rows.length-1} review rows to ${path}.`);
console.log('Independent reviewers should mark each review column APPROVE / REVISE / REJECT and add notes. Do not promote an item to production_approved until required reviews are complete.');
