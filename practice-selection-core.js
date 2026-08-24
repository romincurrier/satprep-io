// Pure adaptive item-selection logic for commercial guided practice.
// This module intentionally has no database or browser dependencies so selection behavior
// can be regression-tested independently of Supabase/Vercel runtime state.

export function normalizedMastery(value){
 const n=Number(value);
 return Number.isFinite(n)?Math.max(0,Math.min(1,n)):null;
}

export function adaptiveBand(mastery){
 const m=normalizedMastery(mastery);
 if(m===null)return'balanced';
 if(m<0.4)return'foundation';
 if(m<0.75)return'balanced';
 return'challenge';
}

export function difficultyTargets(mastery,length=5){
 const count=Math.max(1,Math.min(20,Number(length)||5));
 const patterns={
  foundation:[1,1,2,2,2],
  balanced:[1,2,2,2,3],
  challenge:[2,2,2,3,3]
 };
 const pattern=patterns[adaptiveBand(mastery)],out=[];
 for(let i=0;i<count;i++)out.push(pattern[i%pattern.length]);
 return out;
}

function shuffled(items,randomIntFn){
 const out=[...items];
 for(let i=out.length-1;i>0;i--){
  const j=randomIntFn(i+1);
  [out[i],out[j]]=[out[j],out[i]];
 }
 return out;
}

export function selectAdaptiveItems(bank,{length=5,mastery=null,randomIntFn=max=>Math.floor(Math.random()*max)}={}){
 const desired=Math.max(1,Math.min(20,Number(length)||5));
 const pool=shuffled((bank||[]).filter(x=>[1,2,3].includes(Number(x?.difficulty))),randomIntFn);
 if(pool.length<desired)return pool;
 const chosen=[],targets=difficultyTargets(mastery,desired);
 for(const target of targets){
  const exact=pool.find(x=>Number(x.difficulty)===target&&!chosen.includes(x));
  if(exact){chosen.push(exact);continue}
  const remaining=pool.filter(x=>!chosen.includes(x)).sort((a,b)=>Math.abs(Number(a.difficulty)-target)-Math.abs(Number(b.difficulty)-target));
  if(remaining[0])chosen.push(remaining[0]);
 }
 for(const item of pool)if(chosen.length<desired&&!chosen.includes(item))chosen.push(item);
 return chosen.slice(0,desired);
}
