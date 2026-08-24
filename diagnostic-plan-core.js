import {examKey} from './sat-spec.js';

const RW_QUOTA={'information-and-ideas':3,'craft-and-structure':3,'expression-of-ideas':2,'standard-english-conventions':3};
const MATH_QUOTA={algebra:3,'advanced-math':3,'problem-solving-data-analysis':2,'geometry-trigonometry':1};

function hashSeed(value){let h=2166136261;for(const ch of String(value||'satprep')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=hashSeed(seed)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function shuffle(items,random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function normalizedPriorities(priorities){return (priorities||[]).map((p,i)=>({skill:String(p.skill||p.skill_key||''),mastery:Number(p.mastery??p.score??1),rank:i})).filter(p=>p.skill).sort((a,b)=>a.mastery-b.mastery||a.rank-b.rank)}
function priorityRank(item,priorities){const i=priorities.findIndex(p=>p.skill===item.skill);return i<0?999:i}
function chooseDomain(pool,count,priorities,random){
 const ordered=shuffle(pool,random).sort((a,b)=>priorityRank(a,priorities)-priorityRank(b,priorities)||a.difficulty-b.difficulty);
 const chosen=[];
 for(const target of [1,2,3]){const q=ordered.find(x=>x.difficulty===target&&!chosen.includes(x));if(q&&chosen.length<count)chosen.push(q)}
 for(const q of ordered)if(chosen.length<count&&!chosen.includes(q))chosen.push(q);
 return chosen.slice(0,count);
}
function examLabel(targetExam){const k=examKey(targetExam);return k==='SAT'?'SAT':k==='PSAT_10'?'PSAT 10':'PSAT/NMSQT'}
function usableFormat(q){const format=q?.format||'mcq';return q?.section==='RW'?format==='mcq':q?.section==='MATH'&&['mcq','spr'].includes(format)}
function enforceSprMix(selected,eligible,target,priorities,random){
 let sprCount=selected.filter(x=>x.section==='MATH'&&(x.format||'mcq')==='spr').length;
 if(sprCount>=target)return;
 const candidates=shuffle(eligible.filter(x=>x.section==='MATH'&&(x.format||'mcq')==='spr'&&!selected.includes(x)),random).sort((a,b)=>priorityRank(a,priorities)-priorityRank(b,priorities)||a.difficulty-b.difficulty);
 for(const candidate of candidates){
  if(sprCount>=target)break;
  const replace=selected.find(x=>x.section==='MATH'&&(x.format||'mcq')==='mcq'&&x.domain===candidate.domain&&x.skill===candidate.skill)
    ||selected.find(x=>x.section==='MATH'&&(x.format||'mcq')==='mcq'&&x.domain===candidate.domain)
    ||selected.find(x=>x.section==='MATH'&&(x.format||'mcq')==='mcq');
  if(!replace)break;
  const index=selected.indexOf(replace);selected[index]=candidate;sprCount++;
 }
}

// Secure runtime planning is deliberately dependency-injected: callers must supply
// an already approved bank. This file never imports an authored question bank or key.
export function buildDiagnosticPlan({targetExam='SAT',priorities=[],seed='satprep',length=20,bank=[]}={}){
 const exam=examLabel(targetExam),source=Array.isArray(bank)?bank:[],random=rng(`${seed}:${exam}`),pri=normalizedPriorities(priorities);
 const eligible=source.filter(q=>(!q.exams||q.exams.includes(exam))&&usableFormat(q));
 const selected=[];
 const addSection=(section,quota)=>{
  for(const [domain,count] of Object.entries(quota)){
   const pool=eligible.filter(q=>q.section===section&&q.domain===domain&&!selected.includes(q));
   selected.push(...chooseDomain(pool,count,pri,random));
  }
 };
 addSection('RW',RW_QUOTA);addSection('MATH',MATH_QUOTA);
 const desiredRW=Math.round(length*54/98),desiredMath=length-desiredRW;
 const fill=(section,target)=>{for(const q of shuffle(eligible.filter(x=>x.section===section&&!selected.includes(x)),random).sort((a,b)=>priorityRank(a,pri)-priorityRank(b,pri))){if(selected.filter(x=>x.section===section).length>=target)break;selected.push(q)}};
 fill('RW',desiredRW);fill('MATH',desiredMath);
 // The public digital SAT Math specification is approximately 25% student-produced
 // responses. For a short diagnostic, target the nearest practical count when the
 // independently approved bank has enough SPR content, without sacrificing domain coverage.
 enforceSprMix(selected,eligible,Math.max(1,Math.round(desiredMath*.25)),pri,random);
 return selected.slice(0,length).map((q,position)=>({position,itemId:q.id,section:q.section,domain:q.domain,skill:q.skill,difficulty:q.difficulty,format:q.format||'mcq',isTargeted:priorityRank(q,pri)<4}));
}

export function validateDiagnosticPlan(plan,{length=20,requireSpr=false}={}){
 const errors=[];if(plan.length!==length)errors.push(`Expected ${length} items, received ${plan.length}`);
 if(new Set(plan.map(x=>x.itemId)).size!==plan.length)errors.push('Diagnostic plan contains duplicate items');
 for(const section of ['RW','MATH'])if(!plan.some(x=>x.section===section))errors.push(`Diagnostic plan is missing ${section}`);
 for(const domain of [...Object.keys(RW_QUOTA),...Object.keys(MATH_QUOTA)])if(!plan.some(x=>x.domain===domain))errors.push(`Diagnostic plan is missing domain ${domain}`);
 if(plan.some(x=>x.section==='RW'&&x.format==='spr'))errors.push('Reading and Writing diagnostic items must be multiple choice');
 if(requireSpr){const math=plan.filter(x=>x.section==='MATH'),spr=math.filter(x=>x.format==='spr').length,target=Math.max(1,Math.round(math.length*.25));if(spr<target)errors.push(`Diagnostic Math mix requires at least ${target} student-produced response items; received ${spr}`)}
 return errors;
}
