import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildDiagnosticPlan,validateDiagnosticPlan} from '../diagnostic-blueprint.js';
import {safeQuestion} from '../server/diagnostic-core.js';
import {PRACTICE_BANK,STAGED_PRACTICE_BANK,validatePracticeBank} from '../practice-bank-v2.js';

const domains={
 RW:['information-and-ideas','craft-and-structure','expression-of-ideas','standard-english-conventions'],
 MATH:['algebra','advanced-math','problem-solving-data-analysis','geometry-trigonometry']
};
const bank=[];
for(const [section,keys] of Object.entries(domains)){
 for(const domain of keys){
  for(let i=0;i<5;i++)bank.push({id:`test-${section}-${domain}-${i}`,section,domain,skill:`test-${domain}`,difficulty:(i%3)+1,format:'mcq',exams:['SAT']});
 }
}
const plan=buildDiagnosticPlan({targetExam:'SAT',seed:'regression-seed',bank});
assert.deepEqual(validateDiagnosticPlan(plan),[],'Synthetic SAT diagnostic plan should satisfy the 20-item blueprint.');
assert.equal(plan.length,20,'Diagnostic plan should contain 20 questions.');
assert.equal(plan.filter(x=>x.section==='RW').length,11,'Diagnostic plan should contain 11 Reading & Writing questions.');
assert.equal(plan.filter(x=>x.section==='MATH').length,9,'Diagnostic plan should contain 9 Math questions.');
assert.equal(new Set(plan.map(x=>x.itemId)).size,20,'Diagnostic plan should not repeat an item.');
for(const domain of [...domains.RW,...domains.MATH])assert.ok(plan.some(x=>x.domain===domain),`Diagnostic plan should cover ${domain}.`);
assert.deepEqual(buildDiagnosticPlan({targetExam:'SAT',seed:'regression-seed',bank}),plan,'The same diagnostic seed should produce the same plan.');

const projected=safeQuestion({id:'private-item',section:'RW',domain:'information-and-ideas',skill:'inferences',difficulty:2,format:'mcq',stimulus:{type:'text',text:'Example'},stem:'Example?',choices:['A','B','C','D'],estimatedSeconds:60,answerIndex:2,explanation:'Private explanation',distractorRationales:['x']},3,20);
assert.equal(projected.position,3);
assert.equal(projected.total,20);
for(const secret of ['answerIndex','explanation','distractorRationales','distractor_rationales','correctAnswer'])assert.ok(!(secret in projected),`Safe diagnostic projection must not expose ${secret}.`);

assert.deepEqual(validatePracticeBank(STAGED_PRACTICE_BANK),[],'The complete staged practice bank should pass structural QA.');
assert.ok(PRACTICE_BANK.length>0,'The prelaunch student QA bank should not be empty.');
assert.ok(STAGED_PRACTICE_BANK.length>=PRACTICE_BANK.length,'Staged practice inventory should contain the student QA subset.');

const learning=fs.readFileSync(new URL('../learning-v2.js',import.meta.url),'utf8');
assert.match(learning,/Correct answer:/,'Practice mode must display the correct answer after submission.');
assert.match(learning,/How to solve it:/,'Practice mode must display an instructional explanation after submission.');
assert.match(learning,/result\.correct\?'✓ Correct':'Not quite — review the process'/,'Practice mode must give feedback for both correct and incorrect responses.');
const diagnostic=fs.readFileSync(new URL('../diagnostic-router.js',import.meta.url),'utf8');
assert.match(diagnostic,/answers and explanations are intentionally withheld until learning\/practice sessions/i,'Diagnostic UI must state that answer feedback is withheld during assessment.');
assert.ok(!/diagnostic-feedback\.js/.test(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8')),'Diagnostic feedback module must not be loaded.');

console.log('Core diagnostic, content, and learning regression checks passed.');
