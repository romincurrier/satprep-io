import {QUESTION_BANK,validateQuestionBank,eligibleQuestions} from '../question-bank-production.js';
import {SKILL_INDEX} from '../sat-spec.js';
import {buildDiagnosticPlan,validateDiagnosticPlan} from '../diagnostic-blueprint.js';
import {SKILL_GUIDES} from '../skill-guides.js';
import {PRACTICE_BANK,validatePracticeBank} from '../practice-bank.js';

const errors=[...validateQuestionBank(),...validatePracticeBank()];
const diagnosticCounts={},practiceCounts={};
for(const q of QUESTION_BANK)diagnosticCounts[q.skill]=(diagnosticCounts[q.skill]||0)+1;
for(const q of PRACTICE_BANK)practiceCounts[q.skill]=(practiceCounts[q.skill]||0)+1;
const diagnosticIds=new Set(QUESTION_BANK.map(q=>q.id));
const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
const stimulusFingerprint=s=>typeof s==='string'?norm(s):norm(JSON.stringify(s||null));
const fingerprint=q=>`${stimulusFingerprint(q.stimulus)}|${norm(q.stem)}|${(q.choices||[]).map(norm).join('|')}`;
const diagnosticFingerprints=new Set(QUESTION_BANK.map(fingerprint));
for(const q of PRACTICE_BANK){
 if(diagnosticIds.has(q.id))errors.push(`Practice item duplicates diagnostic id: ${q.id}`);
 if(diagnosticFingerprints.has(fingerprint(q)))errors.push(`Practice item duplicates a complete diagnostic item: ${q.id}`);
 if(q.origin!=='satprep_original_practice')errors.push(`${q.id}: practice origin must be satprep_original_practice`);
}
for(const skill of Object.keys(SKILL_INDEX)){
 if(!diagnosticCounts[skill])errors.push(`No proprietary diagnostic item covers required skill: ${skill}`);
 else if(diagnosticCounts[skill]<2)errors.push(`Development diagnostic bank requires at least 2 original items for ${skill}; found ${diagnosticCounts[skill]}`);
 if(!practiceCounts[skill])errors.push(`No practice-only item covers required skill: ${skill}`);
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
console.log(`Diagnostic content validation passed: ${QUESTION_BANK.length} original assessment items (${bySection.RW||0} RW, ${bySection.MATH||0} Math), with at least two items for every official skill point.`);
console.log(`Practice content validation passed: ${PRACTICE_BANK.length} separate practice-only items covering all ${Object.keys(SKILL_INDEX).length} official skill points.`);
console.log(`Instructional coverage passed: ${Object.keys(SKILL_GUIDES).length} official-skill teaching guides.`);
console.log('Diagnostic blueprint validation passed for SAT, PSAT/NMSQT, and PSAT 10.');
console.log('QA note: internal_review content is development content. Production launch requires independent accuracy/alignment/editorial review and a substantially deeper pool per skill.');
