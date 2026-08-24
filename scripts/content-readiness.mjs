import {QUESTION_BANK} from '../question-bank-production.js';
import {PRACTICE_BANK} from '../practice-bank-v2.js';
import {SKILL_INDEX} from '../sat-spec.js';

const LAUNCH_TARGET={diagnosticPerSkill:6,practicePerSkill:8,productionApprovedPerSkill:4};
const count=(bank,skill,filter=()=>true)=>bank.filter(q=>q.skill===skill&&filter(q)).length;
const rows=Object.entries(SKILL_INDEX).map(([skill,meta])=>{
 const diagnostic=count(QUESTION_BANK,skill),practice=count(PRACTICE_BANK,skill),approvedDiagnostic=count(QUESTION_BANK,skill,q=>q.status==='production_approved'),approvedPractice=count(PRACTICE_BANK,skill,q=>q.status==='production_approved');
 const difficulties=[1,2,3].filter(d=>QUESTION_BANK.some(q=>q.skill===skill&&q.difficulty===d)||PRACTICE_BANK.some(q=>q.skill===skill&&q.difficulty===d));
 return{section:meta.section,domain:meta.domainName,skill:meta.name,skillKey:skill,diagnostic,practice,approvedDiagnostic,approvedPractice,difficulties:difficulties.join(','),launchDepth:diagnostic>=LAUNCH_TARGET.diagnosticPerSkill&&practice>=LAUNCH_TARGET.practicePerSkill,launchApproved:approvedDiagnostic>=LAUNCH_TARGET.productionApprovedPerSkill&&approvedPractice>=LAUNCH_TARGET.productionApprovedPerSkill};
});
const readyDepth=rows.filter(r=>r.launchDepth).length,readyApproved=rows.filter(r=>r.launchApproved).length,total=rows.length;
console.log(`SATprep.io content readiness — ${new Date().toISOString()}`);
console.log(`Development coverage: ${QUESTION_BANK.length} diagnostic items, ${PRACTICE_BANK.length} practice items, ${total} official skills.`);
console.log(`Launch-depth target: ${LAUNCH_TARGET.diagnosticPerSkill} diagnostic + ${LAUNCH_TARGET.practicePerSkill} practice items per skill.`);
console.log(`Skills at launch-depth target: ${readyDepth}/${total}. Skills with minimum production-approved depth: ${readyApproved}/${total}.`);
console.table(rows);
console.log('\nImportant: item counts are not a quality substitute. “production_approved” must require independent answer-key, explanation, taxonomy/alignment, originality, accessibility, and editorial review.');
if(process.argv.includes('--strict')&&(readyDepth<total||readyApproved<total))process.exit(2);
