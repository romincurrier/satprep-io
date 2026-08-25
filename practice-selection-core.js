// Pure adaptive item-selection logic for commercial guided practice.
// This module intentionally has no database or browser dependencies so selection behavior
// can be regression-tested independently of Supabase/Vercel runtime state.

export function normalizedMastery(value){
 if(value===null||value===undefined||value==='')return null;
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

function recencyMap(recentItemIds){
 const map=new Map();
 for(const [index,id] of (recentItemIds||[]).entries())if(id!=null&&!map.has(String(id)))map.set(String(id),index);
 return map;
}

function freshness(item,recency){
 const key=String(item?.id??'');
 return recency.has(key)?recency.get(key):Number.MAX_SAFE_INTEGER;
}

function preferFresher(a,b,recency){return freshness(b,recency)-freshness(a,recency)}

function enforceSprTarget(chosen,pool,target,recency){
 let need=Math.max(0,Math.min(chosen.length,Number(target)||0))-chosen.filter(x=>x.format==='spr').length;
 if(need<=0)return chosen;
 const candidates=pool.filter(x=>x.format==='spr'&&!chosen.includes(x)).sort((a,b)=>preferFresher(a,b,recency));
 while(need>0&&candidates.length){
  const candidate=candidates.shift();
  const mcqIndexes=chosen.map((x,i)=>({x,i})).filter(({x})=>x.format!=='spr');
  if(!mcqIndexes.length)break;
  mcqIndexes.sort((a,b)=>{
   const distance=Math.abs(Number(a.x.difficulty)-Number(candidate.difficulty))-Math.abs(Number(b.x.difficulty)-Number(candidate.difficulty));
   if(distance)return distance;
   return freshness(a.x,recency)-freshness(b.x,recency);
  });
  chosen[mcqIndexes[0].i]=candidate;need--;
 }
 return chosen;
}

export function selectAdaptiveItems(bank,{length=5,mastery=null,sprTarget=0,recentItemIds=[],randomIntFn=max=>Math.floor(Math.random()*max)}={}){
 const desired=Math.max(1,Math.min(20,Number(length)||5));
 const recency=recencyMap(recentItemIds);
 const pool=shuffled((bank||[]).filter(x=>[1,2,3].includes(Number(x?.difficulty))),randomIntFn);
 if(pool.length<desired)return enforceSprTarget(pool,pool,sprTarget,recency);
 const chosen=[],targets=difficultyTargets(mastery,desired);
 for(const target of targets){
  const exact=pool.filter(x=>Number(x.difficulty)===target&&!chosen.includes(x)).sort((a,b)=>preferFresher(a,b,recency));
  if(exact[0]){chosen.push(exact[0]);continue}
  const remaining=pool.filter(x=>!chosen.includes(x)).sort((a,b)=>{
   const distance=Math.abs(Number(a.difficulty)-target)-Math.abs(Number(b.difficulty)-target);
   return distance||preferFresher(a,b,recency);
  });
  if(remaining[0])chosen.push(remaining[0]);
 }
 for(const item of pool.filter(x=>!chosen.includes(x)).sort((a,b)=>preferFresher(a,b,recency)))if(chosen.length<desired)chosen.push(item);
 return enforceSprTarget(chosen.slice(0,desired),pool,sprTarget,recency);
}
