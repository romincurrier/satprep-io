import assert from 'node:assert/strict';
import {adaptiveBand,difficultyTargets,selectAdaptiveItems} from '../practice-selection-core.js';

const bank=[];
for(const difficulty of [1,2,3])for(let i=0;i<6;i++)bank.push({id:`d${difficulty}-${i}`,difficulty,format:'mcq'});
const zero=()=>0;
const counts=items=>items.reduce((m,x)=>(m[x.difficulty]=(m[x.difficulty]||0)+1,m),{});

assert.equal(adaptiveBand(null),'balanced');
assert.equal(adaptiveBand(0.2),'foundation');
assert.equal(adaptiveBand(0.6),'balanced');
assert.equal(adaptiveBand(0.85),'challenge');
assert.deepEqual(difficultyTargets(0.2,5),[1,1,2,2,2]);
assert.deepEqual(difficultyTargets(0.6,5),[1,2,2,2,3]);
assert.deepEqual(difficultyTargets(0.85,5),[2,2,2,3,3]);

assert.deepEqual(counts(selectAdaptiveItems(bank,{length:5,mastery:0.2,randomIntFn:zero})),{'1':2,'2':3});
assert.deepEqual(counts(selectAdaptiveItems(bank,{length:5,mastery:0.6,randomIntFn:zero})),{'1':1,'2':3,'3':1});
assert.deepEqual(counts(selectAdaptiveItems(bank,{length:5,mastery:0.85,randomIntFn:zero})),{'2':3,'3':2});

const sparse=[{id:'a',difficulty:1,format:'mcq'},{id:'b',difficulty:1,format:'mcq'},{id:'c',difficulty:2,format:'mcq'},{id:'d',difficulty:2,format:'mcq'},{id:'e',difficulty:2,format:'mcq'}];
const fallback=selectAdaptiveItems(sparse,{length:5,mastery:0.9,randomIntFn:zero});
assert.equal(fallback.length,5);
assert.equal(new Set(fallback.map(x=>x.id)).size,5);

const mixed=[...bank,{id:'spr-1',difficulty:1,format:'spr'},{id:'spr-2',difficulty:2,format:'spr'},{id:'spr-3',difficulty:3,format:'spr'}];
const mathFive=selectAdaptiveItems(mixed,{length:5,mastery:0.6,sprTarget:1,randomIntFn:zero});
assert.equal(mathFive.length,5);
assert.ok(mathFive.some(x=>x.format==='spr'),'Math-guided practice should include an SPR when an approved SPR pool supports the target.');
assert.equal(new Set(mathFive.map(x=>x.id)).size,5,'SPR format balancing must not duplicate practice items.');
const bestEffort=selectAdaptiveItems(bank,{length:5,mastery:0.6,sprTarget:1,randomIntFn:zero});
assert.equal(bestEffort.filter(x=>x.format==='spr').length,0,'SPR balancing must degrade safely when no approved SPR is available.');

const rotationBank=[
 {id:'recent-1',difficulty:1,format:'mcq'},{id:'fresh-1',difficulty:1,format:'mcq'},
 {id:'recent-2',difficulty:2,format:'mcq'},{id:'fresh-2a',difficulty:2,format:'mcq'},{id:'fresh-2b',difficulty:2,format:'mcq'},
 {id:'recent-3',difficulty:3,format:'mcq'},{id:'fresh-3',difficulty:3,format:'mcq'}
];
const rotated=selectAdaptiveItems(rotationBank,{length:5,mastery:0.6,recentItemIds:['recent-1','recent-2','recent-3'],randomIntFn:zero});
assert.equal(rotated.length,5);
assert.ok(rotated.some(x=>x.id==='fresh-1'),'Practice rotation should prefer an unseen item at the same target difficulty.');
assert.ok(rotated.some(x=>x.id==='fresh-3'),'Practice rotation should prefer an unseen challenge item at the same target difficulty.');
assert.ok(!rotated.some(x=>x.id==='recent-1'),'Practice rotation should avoid a recent item when an equally suitable unseen item exists.');
assert.ok(!rotated.some(x=>x.id==='recent-3'),'Practice rotation should avoid a recent item when an equally suitable unseen item exists.');
assert.ok(rotated.some(x=>x.id==='recent-2'),'Rotation may reuse an item when the adaptive difficulty target requires more items than the fresh pool contains.');

const allSeen=[{id:'newest',difficulty:2,format:'mcq'},{id:'middle',difficulty:2,format:'mcq'},{id:'oldest',difficulty:2,format:'mcq'}];
const leastRecent=selectAdaptiveItems(allSeen,{length:1,mastery:0.6,recentItemIds:['newest','middle','oldest'],randomIntFn:zero});
assert.equal(leastRecent[0].id,'oldest','When every suitable item was seen recently, the least-recently-used item should be preferred.');

console.log('Adaptive commercial practice selection checks passed, including Math SPR balancing and least-recently-used rotation.');
