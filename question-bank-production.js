import {QUESTION_BANK as SEED_BANK} from './question-bank.js';
import {EXTRA_QUESTIONS} from './question-bank-extra.js';
import {SKILL_INDEX,skillEligibleForExam} from './sat-spec.js';

export const QUESTION_BANK=[...SEED_BANK,...EXTRA_QUESTIONS];
export function examsFor(item){return item.exams||['SAT','PSAT/NMSQT','PSAT 10']}
export function eligibleQuestions(targetExam){return QUESTION_BANK.filter(q=>examsFor(q).includes(targetExam)&&skillEligibleForExam(q.skill,targetExam))}
export function questionById(id){return QUESTION_BANK.find(q=>q.id===id)||null}
export function validateQuestionBank(){
 const errors=[],ids=new Set();
 for(const q of QUESTION_BANK){
  if(!q.id||ids.has(q.id))errors.push(`Duplicate or missing id: ${q.id}`);ids.add(q.id);
  const skill=SKILL_INDEX[q.skill];if(!skill)errors.push(`${q.id}: unknown skill ${q.skill}`);
  else if(skill.domainKey!==q.domain||skill.section!==q.section)errors.push(`${q.id}: section/domain does not match skill taxonomy`);
  if(!['RW','MATH'].includes(q.section))errors.push(`${q.id}: invalid section`);
  if(![1,2,3].includes(q.difficulty))errors.push(`${q.id}: difficulty must be 1, 2, or 3`);
  if(q.format==='mcq'){
   if(!Array.isArray(q.choices)||q.choices.length!==4)errors.push(`${q.id}: MCQ must have exactly four choices`);
   if(!Number.isInteger(q.answerIndex)||q.answerIndex<0||q.answerIndex>3)errors.push(`${q.id}: invalid answer index`);
  }
  if(q.origin!=='satprep_original')errors.push(`${q.id}: non-original origin is not allowed in the proprietary bank`);
  if(!q.explanation||q.explanation.length<20)errors.push(`${q.id}: explanation is required`);
  if(!q.status)errors.push(`${q.id}: QA status is required`);
  for(const exam of examsFor(q))if(!['SAT','PSAT/NMSQT','PSAT 10'].includes(exam))errors.push(`${q.id}: invalid exam eligibility ${exam}`);
 }
 return errors;
}
