import {QUESTION_BANK,validateQuestionBank,eligibleQuestions} from '../question-bank-production.js';
import {SKILL_INDEX} from '../sat-spec.js';
import {buildDiagnosticPlan,validateDiagnosticPlan} from '../diagnostic-blueprint.js';
import {SKILL_GUIDES} from '../skill-guides.js';
import {STAGED_PRACTICE_BANK,validatePracticeBank} from '../practice-bank-v2.js';

const PRACTICE_BANK=STAGED_PRACTICE_BANK;
const errors=[...validateQuestionBank(),...validatePracticeBank(PRACTICE_BANK)];
const diagnosticCounts={},practiceCounts={};
for(const q of QUESTION_BANK)diagnosticCounts[q.skill]=(diagnosticCounts[q.skill]||0)+1;
for(const q of PRACTICE_BANK)practiceCounts[q.skill]=(practiceCounts[q.skill]||0)+1;
const diagnosticIds=new Set(QUESTION_BANK.map(q=>q.id));
const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
const stimulusFingerprint=s=>typeof s==='string'?norm(s):norm(JSON.stringify(s||null));
const fingerprint=q=>`${stimulusFingerprint(q.stimulus)}|${norm(q.stem)}|${(q.choices||[]).map(norm).join('|')}`;
const diagnosticFingerprints=new Set(QUESTION_BANK.map(fingerprint));
const practiceFingerprints=new Map();
for(const q of PRACTICE_BANK){
 if(diagnosticIds.has(q.id))errors.push(`Practice item duplicates diagnostic id: ${q.id}`);
 const fp=fingerprint(q);
 if(diagnosticFingerprints.has(fp))errors.push(`Practice item duplicates a complete diagnostic item: ${q.id}`);
 if(practiceFingerprints.has(fp))errors.push(`Practice item duplicates another staged practice item: ${q.id} matches ${practiceFingerprints.get(fp)}`);
 else practiceFingerprints.set(fp,q.id);
 if(q.origin!=='satprep_original_practice')errors.push(`${q.id}: practice origin must be satprep_original_practice`);
}
for(const skill of Object.keys(SKILL_INDEX)){
 if(!diagnosticCounts[skill])errors.push(`No proprietary diagnostic item covers required skill: ${skill}`);
 else if(diagnosticCounts[skill]<2)errors.push(`Development diagnostic bank requires at least 2 original items for ${skill}; found ${diagnosticCounts[skill]}`);
 if(!practiceCounts[skill])errors.push(`No practice-only item covers required skill: ${skill}`);
 else if(practiceCounts[skill]<3)errors.push(`Staged practice bank requires at least 3 original items for ${skill}; found ${practiceCounts[skill]}`);
 if(!SKILL_GUIDES[skill])errors.push(`Missing instructional guide for ${skill}`);
}
for(const exam of ['SAT','PSAT/NMSQT','PSAT 10']){
 const eligible=eligibleQuestions(exam),sections=new Set(eligible.map(q=>q.section));
 if(!sections.has('RW')||!sections.has('MATH'))errors.push(`${exam}: diagnostic bank must contain both sections`);
 const plan=buildDiagnosticPlan({targetExam:exam,seed:'build-validation',priorities:[{skill:'inferences',mastery:.25},{skill:'linear-equations-one-variable',mastery:.35}]});
 for(const e of validateDiagnosticPlan(plan))errors.push(`${exam}: ${e}`);
 for(const p of plan)if(!eligible.some(q=>q.id===p.itemId))errors.push(`${exam}: plan selected ineligible item ${p.itemId}`);
}

if(errors.length){
 console.error(`Content validation failed with ${errors.length} issue(s):`);
 for(const e of errors)console.error(`- ${e}`);
 process.exit(1);
}

const bySection=QUESTION_BANK.reduce((m,q)=>{m[q.section]=(m[q.section]||0)+1;return m},{});
const practiceBySection=PRACTICE_BANK.reduce((m,q)=>{m[q.section]=(m[q.section]||0)+1;return m},{});
console.log(`Diagnostic content validation passed: ${QUESTION_BANK.length} original assessment items (${bySection.RW||0} RW, ${bySection.MATH||0} Math), with at least two items for every official skill point.`);
console.log(`Staged practice validation passed: ${PRACTICE_BANK.length} original practice items (${practiceBySection.RW||0} RW, ${practiceBySection.MATH||0} Math), with at least three items for every official skill point.`);
console.log(`Instructional coverage passed: ${Object.keys(SKILL_GUIDES).length} official-skill teaching guides.`);
console.log('Diagnostic blueprint validation passed for SAT, PSAT/NMSQT, and PSAT 10.');
console.log('QA note: staged/internal_review content remains non-student-facing until independent accuracy/alignment/editorial review is complete.');
