import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {QUESTION_BANK} from '../question-bank-production.js';
import {PRACTICE_BANK,STAGED_PRACTICE_BANK} from '../practice-bank-v2.js';
import {SKILL_INDEX} from '../sat-spec.js';

const LAUNCH_TARGET={diagnosticPerSkill:6,practicePerSkill:8,productionApprovedPerSkill:4};
const registry=JSON.parse(fs.readFileSync('content-approval-registry.json','utf8'));
const canonical=(type,q)=>({type,id:q.id,section:q.section,domain:q.domain,skill:q.skill,difficulty:q.difficulty,exams:q.exams||['SAT','PSAT/NMSQT','PSAT 10'],stimulus:q.stimulus??null,stem:q.stem,choices:q.choices||null,answerIndex:q.answerIndex,explanation:q.explanation});
const hash=(type,q)=>createHash('sha256').update(JSON.stringify(canonical(type,q))).digest('hex');
const approved=(type,q)=>registry.approvals?.[`${type}:${q.id}`]?.content_hash===hash(type,q);
const count=(bank,skill,filter=()=>true)=>bank.filter(q=>q.skill===skill&&filter(q)).length;
const rows=Object.entries(SKILL_INDEX).map(([skill,meta])=>{
 const diagnostic=count(QUESTION_BANK,skill),practice=count(PRACTICE_BANK,skill),stagedPractice=count(STAGED_PRACTICE_BANK,skill),approvedDiagnostic=count(QUESTION_BANK,skill,q=>approved('diagnostic',q)),approvedPractice=count(STAGED_PRACTICE_BANK,skill,q=>approved('practice',q));
 const difficulties=[1,2,3].filter(d=>QUESTION_BANK.some(q=>q.skill===skill&&q.difficulty===d)||STAGED_PRACTICE_BANK.some(q=>q.skill===skill&&q.difficulty===d));
 return{section:meta.section,domain:meta.domainName,skill:meta.name,skillKey:skill,diagnostic,studentPractice:practice,stagedPractice,approvedDiagnostic,approvedPractice,difficulties:difficulties.join(','),launchDepth:diagnostic>=LAUNCH_TARGET.diagnosticPerSkill&&stagedPractice>=LAUNCH_TARGET.practicePerSkill,launchApproved:approvedDiagnostic>=LAUNCH_TARGET.productionApprovedPerSkill&&approvedPractice>=LAUNCH_TARGET.productionApprovedPerSkill};
});
const readyDepth=rows.filter(r=>r.launchDepth).length,readyApproved=rows.filter(r=>r.launchApproved).length,total=rows.length,totalApprovedDiagnostic=QUESTION_BANK.filter(q=>approved('diagnostic',q)).length,totalApprovedPractice=STAGED_PRACTICE_BANK.filter(q=>approved('practice',q)).length;
console.log(`SATprep.io content readiness — ${new Date().toISOString()}`);
console.log(`Development coverage: ${QUESTION_BANK.length} diagnostic items, ${PRACTICE_BANK.length} student-facing practice items, ${STAGED_PRACTICE_BANK.length} practice items including staged QA content, ${total} official skills.`);
console.log(`Human-review registry: ${totalApprovedDiagnostic} diagnostic + ${totalApprovedPractice} practice items currently hold hash-valid approvals.`);
console.log(`Launch-depth target: ${LAUNCH_TARGET.diagnosticPerSkill} diagnostic + ${LAUNCH_TARGET.practicePerSkill} practice items per skill.`);
console.log(`Skills at staged launch-depth target: ${readyDepth}/${total}. Skills with minimum human-approved depth: ${readyApproved}/${total}.`);
console.table(rows);
console.log('\nImportant: staged items are NOT student-facing until QA is cleared. Item counts are not a quality substitute. Human approval requires independent answer-key, explanation, taxonomy/alignment, originality, accessibility, and editorial review and is invalidated automatically by any content change.');
if(process.argv.includes('--strict')&&(readyDepth<total||readyApproved<total))process.exit(2);
