import assert from 'node:assert/strict';
import {adaptiveBand,difficultyTargets,selectAdaptiveItems} from '../practice-selection-core.js';

const bank=[];
for(const difficulty of [1,2,3])for(let i=0;i<6;i++)bank.push({id:`d${difficulty}-${i}`,difficulty});
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

const sparse=[{id:'a',difficulty:1},{id:'b',difficulty:1},{id:'c',difficulty:2},{id:'d',difficulty:2},{id:'e',difficulty:2}];
const fallback=selectAdaptiveItems(sparse,{length:5,mastery:0.9,randomIntFn:zero});
assert.equal(fallback.length,5);
assert.equal(new Set(fallback.map(x=>x.id)).size,5);

console.log('Adaptive commercial practice selection checks passed.');
