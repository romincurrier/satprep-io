import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {QUESTION_BANK} from '../question-bank-production.js';
import {STAGED_PRACTICE_BANK} from '../practice-bank-v2.js';
import {SKILL_INDEX} from '../sat-spec.js';
import {canonicalReviewContent} from '../content-integrity.js';

const csv=v=>`"${String(v??'').replaceAll('"','""')}"`;
const stimulus=q=>typeof q.stimulus==='string'?q.stimulus:JSON.stringify(q.stimulus??'');
const contentHash=(type,q)=>createHash('sha256').update(JSON.stringify(canonicalReviewContent(type,q))).digest('hex');
const format=q=>q.format||'mcq';
const accepted=q=>format(q)==='spr'?(q.answer?.accepted||q.acceptedAnswers||q.accepted_answers||[]):[];
const correct=q=>format(q)==='spr'?String(q.answer?.display||q.correctAnswerDisplay||accepted(q)[0]||''):String.fromCharCode(65+q.answerIndex);
const row=(type,q)=>[
 type,q.id,contentHash(type,q),q.section,q.domain,q.skill,SKILL_INDEX[q.skill]?.name,q.difficulty,
 (q.exams||['SAT','PSAT/NMSQT','PSAT 10']).join('|'),q.status,format(q),stimulus(q),q.stem,
 ...(q.choices||['','','','']),correct(q),accepted(q).join('|'),q.explanation,
 '','','','','',
 '','','','','',
 '','',''
];
const rows=[
 ['content_type','item_id','content_hash','section','domain','skill_key','skill_name','difficulty','exam_eligibility','qa_status','response_format','stimulus','stem','choice_a','choice_b','choice_c','choice_d','correct_answer','accepted_answers','explanation','accuracy_review','alignment_review','editorial_review','bias_accessibility_review','originality_review','accuracy_reviewer','alignment_reviewer','editorial_reviewer','bias_accessibility_reviewer','originality_reviewer','reviewer','reviewed_at','review_notes'],
 ...QUESTION_BANK.map(q=>row('diagnostic',q)),
 ...STAGED_PRACTICE_BANK.map(q=>row('practice',q))
];
await mkdir('artifacts',{recursive:true});
const path='artifacts/content-review.csv';
await writeFile(path,rows.map(r=>r.map(csv).join(',')).join('\n'),'utf8');
console.log(`Wrote ${rows.length-1} review rows to ${path}.`);
console.log('The content_hash binds each review decision to the exact question/version reviewed, including SPR accepted responses when applicable.');
console.log('For commercial private import, identify the reviewer for each review dimension. The launch policy requires at least three distinct reviewers across the five dimensions, with no reviewer approving more than two dimensions on the same item.');
console.log('For development review validation, the legacy reviewer/reviewed_at fields remain available. Do not promote an item until the completed file passes the applicable review and launch-readiness checks.');
