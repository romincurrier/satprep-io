import {PRACTICE_BANK as BASE_PRACTICE_BANK} from './practice-bank.js';
import {EXTRA_PRACTICE_BANK} from './practice-bank-extra.js';
import {SKILL_INDEX,skillEligibleForExam} from './sat-spec.js';

export const PRACTICE_BANK=[...BASE_PRACTICE_BANK,...EXTRA_PRACTICE_BANK];

function examLabel(targetExam='SAT'){
 const v=String(targetExam||'SAT').toUpperCase();
 if(v.includes('PSAT')&&v.includes('10'))return 'PSAT 10';
 if(v.includes('PSAT'))return 'PSAT/NMSQT';
 return 'SAT';
}

export function practiceForSkill(skill,targetExam='SAT'){
 const exam=examLabel(targetExam);
 return PRACTICE_BANK.filter(q=>q.skill===skill&&skillEligibleForExam(skill,exam)&&(!q.exams||q.exams.includes(exam)));
}

export function validatePracticeBank(){
 const errors=[],ids=new Set();
 for(const q of PRACTICE_BANK){
  if(!q.id||ids.has(q.id))errors.push(`Duplicate or missing practice id ${q.id}`);ids.add(q.id);
  const skill=SKILL_INDEX[q.skill];
  if(!skill)errors.push(`${q.id}: unknown skill ${q.skill}`);
  else if(skill.domainKey!==q.domain||skill.section!==q.section)errors.push(`${q.id}: section/domain does not match skill taxonomy`);
  if(!['RW','MATH'].includes(q.section))errors.push(`${q.id}: invalid section`);
  if(![1,2,3].includes(q.difficulty))errors.push(`${q.id}: difficulty must be 1, 2, or 3`);
  if(!Array.isArray(q.choices)||q.choices.length!==4)errors.push(`${q.id}: four choices required`);
  if(!Number.isInteger(q.answerIndex)||q.answerIndex<0||q.answerIndex>3)errors.push(`${q.id}: invalid answer`);
  if(!q.explanation||q.explanation.length<20)errors.push(`${q.id}: explanation is required`);
  if(q.origin!=='satprep_original_practice')errors.push(`${q.id}: practice origin must be satprep_original_practice`);
  if(!q.status)errors.push(`${q.id}: QA status is required`);
  for(const exam of q.exams||['SAT','PSAT/NMSQT','PSAT 10'])if(!['SAT','PSAT/NMSQT','PSAT 10'].includes(exam))errors.push(`${q.id}: invalid exam eligibility ${exam}`);
 }
 return errors;
}
