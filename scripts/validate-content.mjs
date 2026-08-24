import {QUESTION_BANK,validateQuestionBank,eligibleQuestions} from '../question-bank-production.js';
import {SKILL_INDEX} from '../sat-spec.js';
import {buildDiagnosticPlan,validateDiagnosticPlan} from '../diagnostic-blueprint.js';
import {OFFICIAL_LESSONS,SKILL_GUIDES} from '../learning-catalog.js';

const errors=[...validateQuestionBank()];
const counts={};
for(const q of QUESTION_BANK)counts[q.skill]=(counts[q.skill]||0)+1;
for(const skill of Object.keys(SKILL_INDEX)){
 if(!counts[skill])errors.push(`No proprietary item covers required skill: ${skill}`);
 else if(counts[skill]<2)errors.push(`Development bank requires at least 2 original items for ${skill}; found ${counts[skill]}`);
}
for(const exam of ['SAT','PSAT/NMSQT','PSAT 10']){
 const eligible=eligibleQuestions(exam),sections=new Set(eligible.map(q=>q.section));
 if(!sections.has('RW')||!sections.has('MATH'))errors.push(`${exam}: bank must contain both sections`);
 const plan=buildDiagnosticPlan({targetExam:exam,seed:'build-validation',priorities:[{skill:'inferences',mastery:.25},{skill:'linear-equations-one-variable',mastery:.35}]});
 for(const e of validateDiagnosticPlan(plan))errors.push(`${exam}: ${e}`);
 for(const p of plan)if(!eligible.some(q=>q.id===p.itemId))errors.push(`${exam}: plan selected ineligible item ${p.itemId}`);
}
for(const skill of Object.keys(SKILL_INDEX)){
 const guide=SKILL_GUIDES[skill],lesson=OFFICIAL_LESSONS.find(l=>l.skills.includes(skill));
 if(!guide)errors.push(`Missing instructional guide for ${skill}`);
 if(!lesson)errors.push(`Missing lesson object for ${skill}`);
 else{
  if(!lesson.qs?.length)errors.push(`${skill}: lesson has no practice item`);
  for(const q of lesson.qs||[])if(!/^Correct answer:/i.test(q.e||''))errors.push(`${skill}: practice feedback must state the correct answer before the explanation`);
 }
}

if(errors.length){
 console.error(`Content validation failed with ${errors.length} issue(s):`);
 for(const e of errors)console.error(`- ${e}`);
 process.exit(1);
}

const bySection=QUESTION_BANK.reduce((m,q)=>{m[q.section]=(m[q.section]||0)+1;return m},{});
console.log(`Content validation passed: ${QUESTION_BANK.length} original items (${bySection.RW||0} RW, ${bySection.MATH||0} Math), with at least two items for every official skill point.`);
console.log(`Instructional coverage passed: ${OFFICIAL_LESSONS.length} official-skill lesson guides with explicit correct-answer practice feedback.`);
console.log('Diagnostic blueprint validation passed for SAT, PSAT/NMSQT, and PSAT 10.');
console.log('QA note: internal_review items are development content. Production launch requires independent item review and a substantially deeper pool per skill.');
