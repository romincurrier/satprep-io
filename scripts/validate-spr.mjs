import {strict as assert} from 'node:assert';
import {answerSpec,scoreResponse,validateSprResponse} from '../server/response-scoring.js';

const yes=(spec,response)=>assert.equal(scoreResponse('spr',spec,response).correct,true,`${response} should score correct`);
const no=(spec,response)=>assert.equal(scoreResponse('spr',spec,response).correct,false,`${response} should score incorrect`);

// Exact-equivalence handling: terminating decimals, trailing zeroes, and fractions.
const threeHalf={accepted:['3.5'],display:'3.5'};
yes(threeHalf,'3.5');
yes(threeHalf,'3.50');
yes(threeHalf,'7/2');
no(threeHalf,'3.4');

// Current College Board public directions use these examples for 2/3.
const twoThirds={accepted:['2/3','.6666','.6667','0.666','0.667'],display:'2/3'};
for(const response of ['2/3','.6666','.6667','0.666','0.667'])yes(twoThirds,response);
for(const response of ['.66','0.66','.67','0.67'])no(twoThirds,response);
assert.equal(validateSprResponse('0.6666').valid,false,'Positive SPR entries longer than 5 characters must be rejected.');

const negativeThird={accepted:['-1/3','-.3333','-.333'],display:'-1/3'};
for(const response of ['-1/3','-.3333','-.333'])yes(negativeThird,response);
no(negativeThird,'-.33');

for(const response of ['50%','$5','1,000','3 1/2','1/0',''])assert.equal(validateSprResponse(response).valid,false,`${JSON.stringify(response)} should be invalid SPR syntax`);
assert.equal(answerSpec('spr',{accepted:['1/0'],display:'undefined'}),null,'Invalid authoring key must fail closed.');

const mcq=scoreResponse('mcq',{answerIndex:2},2);
assert.equal(mcq.valid,true);assert.equal(mcq.correct,true);assert.equal(mcq.correctIndex,2);
assert.equal(scoreResponse('mcq',{answerIndex:2},4).valid,false,'MCQ selection must remain bounded to A-D.');

console.log('MCQ/SPR response scoring regression passed, including official-style decimal/fraction entry examples and input-length constraints.');
