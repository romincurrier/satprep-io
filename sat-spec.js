// SATprep.io content taxonomy aligned to the public College Board Digital SAT Suite specifications.
// This file contains factual taxonomy/blueprint metadata only; it does not reproduce College Board questions.
// Reference pages reviewed 2026-08-24:
// https://satsuite.collegeboard.org/practice/content-domains
// https://satsuite.collegeboard.org/k12-educators/about/alignment/reading
// https://satsuite.collegeboard.org/k12-educators/about/alignment/math
// https://satsuite.collegeboard.org/sat/whats-on-the-test/structure

export const EXAMS={SAT:'SAT',PSAT_NMSQT:'PSAT/NMSQT',PSAT_10:'PSAT 10'};

export const SAT_STRUCTURE={
 SAT:{readingWriting:{questions:54,minutes:64,modules:2},math:{questions:44,minutes:70,modules:2}},
 PSAT_NMSQT:{readingWriting:{questions:54,minutes:64,modules:2},math:{questions:44,minutes:70,modules:2}},
 PSAT_10:{readingWriting:{questions:54,minutes:64,modules:2},math:{questions:44,minutes:70,modules:2}}
};

export const RW_DOMAINS=[
 {key:'information-and-ideas',name:'Information and Ideas',approxShare:.26,skills:[
  {key:'central-ideas-details',name:'Central Ideas and Details'},
  {key:'command-evidence-textual',name:'Command of Evidence — Textual'},
  {key:'command-evidence-quantitative',name:'Command of Evidence — Quantitative'},
  {key:'inferences',name:'Inferences'}
 ]},
 {key:'craft-and-structure',name:'Craft and Structure',approxShare:.28,skills:[
  {key:'words-in-context',name:'Words in Context'},
  {key:'text-structure-purpose',name:'Text Structure and Purpose'},
  {key:'cross-text-connections',name:'Cross-Text Connections'}
 ]},
 {key:'expression-of-ideas',name:'Expression of Ideas',approxShare:.20,skills:[
  {key:'rhetorical-synthesis',name:'Rhetorical Synthesis'},
  {key:'transitions',name:'Transitions'}
 ]},
 {key:'standard-english-conventions',name:'Standard English Conventions',approxShare:.26,skills:[
  {key:'boundaries',name:'Boundaries'},
  {key:'form-structure-sense',name:'Form, Structure, and Sense'}
 ]}
];

export const MATH_DOMAINS=[
 {key:'algebra',name:'Algebra',officialRange:[13,15],skills:[
  {key:'linear-equations-one-variable',name:'Linear equations in one variable'},
  {key:'linear-functions',name:'Linear functions'},
  {key:'linear-equations-two-variables',name:'Linear equations in two variables'},
  {key:'systems-linear-equations',name:'Systems of two linear equations in two variables'},
  {key:'linear-inequalities',name:'Linear inequalities in one or two variables'}
 ]},
 {key:'advanced-math',name:'Advanced Math',officialRange:[13,15],skills:[
  {key:'equivalent-expressions',name:'Equivalent expressions'},
  {key:'nonlinear-equations-one-variable',name:'Nonlinear equations in one variable'},
  {key:'systems-equations-two-variables',name:'Systems of equations in two variables'},
  {key:'nonlinear-functions',name:'Nonlinear functions'}
 ]},
 {key:'problem-solving-data-analysis',name:'Problem-Solving and Data Analysis',officialRange:[5,7],skills:[
  {key:'ratios-rates-units',name:'Ratios, rates, proportional relationships, and units'},
  {key:'percentages',name:'Percentages'},
  {key:'one-variable-data',name:'One-variable data: distributions and measures of center and spread'},
  {key:'two-variable-data',name:'Two-variable data: models and scatterplots'},
  {key:'probability',name:'Probability and conditional probability'},
  {key:'sample-statistics',name:'Inference from sample statistics and margin of error',notes:'Margin of error is SAT-only; sample-statistics inference also appears on PSAT/NMSQT and PSAT 10.'},
  {key:'statistical-claims',name:'Evaluating statistical claims: observational studies and experiments',satOnly:true}
 ]},
 {key:'geometry-trigonometry',name:'Geometry and Trigonometry',officialRange:[5,7],skills:[
  {key:'area-volume',name:'Area and volume'},
  {key:'lines-angles-triangles',name:'Lines, angles, and triangles'},
  {key:'right-triangles-trigonometry',name:'Right triangles and trigonometry'},
  {key:'circles',name:'Circles',satOnly:true}
 ]}
];

export const ALL_DOMAINS=[...RW_DOMAINS.map(x=>({...x,section:'RW'})),...MATH_DOMAINS.map(x=>({...x,section:'MATH'}))];
export const SKILL_INDEX=Object.fromEntries(ALL_DOMAINS.flatMap(domain=>domain.skills.map(skill=>[skill.key,{...skill,domainKey:domain.key,domainName:domain.name,section:domain.section}])));
export const DOMAIN_INDEX=Object.fromEntries(ALL_DOMAINS.map(d=>[d.key,d]));

export function examKey(value){const v=String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(v.includes('NMSQT'))return 'PSAT_NMSQT';if(v.includes('PSAT10'))return 'PSAT_10';if(v.includes('PSAT'))return 'PSAT_NMSQT';return 'SAT'}
export function skillEligibleForExam(skillKey,targetExam){const skill=SKILL_INDEX[skillKey];if(!skill)return false;return !(skill.satOnly&&examKey(targetExam)!=='SAT')}
