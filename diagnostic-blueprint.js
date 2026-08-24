import {eligibleQuestions} from './question-bank-production.js';
import {examKey} from './sat-spec.js';
import {buildDiagnosticPlan as buildPlanFromBank,validateDiagnosticPlan} from './diagnostic-plan-core.js';

function examLabel(targetExam){const k=examKey(targetExam);return k==='SAT'?'SAT':k==='PSAT_10'?'PSAT 10':'PSAT/NMSQT'}

// Development/build wrapper. The secure server runtime imports diagnostic-plan-core.js
// directly so the commercial assessment planner has no dependency on committed question keys.
export function buildDiagnosticPlan(options={}){
 const targetExam=options.targetExam||'SAT',bank=Array.isArray(options.bank)?options.bank:eligibleQuestions(examLabel(targetExam));
 return buildPlanFromBank({...options,targetExam,bank});
}

export {validateDiagnosticPlan};
