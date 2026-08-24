import {QUESTION_BANK,validateQuestionBank,eligibleQuestions} from '../question-bank.js';
import {SKILL_INDEX} from '../sat-spec.js';

const errors=[...validateQuestionBank()];
const counts={};
for(const q of QUESTION_BANK)counts[q.skill]=(counts[q.skill]||0)+1;
for(const skill of Object.keys(SKILL_INDEX))if(!counts[skill])errors.push(`No proprietary item covers required skill: ${skill}`);
for(const exam of ['SAT','PSAT/NMSQT','PSAT 10']){
 const eligible=eligibleQuestions(exam),sections=new Set(eligible.map(q=>q.section));
 if(!sections.has('RW')||!sections.has('MATH'))errors.push(`${exam}: bank must contain both sections`);
}

if(errors.length){
 console.error(`Content validation failed with ${errors.length} issue(s):`);
 for(const e of errors)console.error(`- ${e}`);
 process.exit(1);
}

const bySection=QUESTION_BANK.reduce((m,q)=>{m[q.section]=(m[q.section]||0)+1;return m},{});
console.log(`Content validation passed: ${QUESTION_BANK.length} original items (${bySection.RW||0} RW, ${bySection.MATH||0} Math), covering ${Object.keys(SKILL_INDEX).length} official skill points.`);
console.log('QA note: internal_review items are development content. Production launch requires independent item review and a substantially deeper pool per skill.');
