import assert from 'node:assert/strict';
import {COMMERCIAL_CONTENT_POLICY,evaluateSkillCoverage} from '../commercial-content-policy.js';

const items=(counts)=>Object.entries(counts).flatMap(([difficulty,count])=>Array.from({length:count},(_,i)=>({id:`d${difficulty}-${i}`,difficulty:Number(difficulty)})));

assert.equal(COMMERCIAL_CONTENT_POLICY.diagnostic.minApprovedPerSkill,6);
assert.equal(COMMERCIAL_CONTENT_POLICY.practice.minApprovedPerSkill,8);
assert.equal(COMMERCIAL_CONTENT_POLICY.practice.sessionLength,5);

assert.equal(evaluateSkillCoverage(items({1:1,2:4,3:1}),'diagnostic').ready,true,'Six approved diagnostic items spanning all three difficulty levels should satisfy the release-engineering depth gate.');
assert.equal(evaluateSkillCoverage(items({1:0,2:5,3:1}),'diagnostic').ready,false,'Diagnostic coverage must not pass without difficulty-1 inventory.');
assert.equal(evaluateSkillCoverage(items({1:2,2:3,3:3}),'practice').ready,true,'Eight approved practice items with the adaptive difficulty floor should pass.');
assert.equal(evaluateSkillCoverage(items({1:2,2:3,3:2}),'practice').ready,false,'The seven-item adaptive floor alone must not satisfy the eight-item rotation-depth requirement.');
assert.equal(evaluateSkillCoverage(items({1:2,2:4,3:2}),'practice').ready,true,'Extra approved inventory may sit in any supported difficulty once the minimum adaptive mix is met.');
assert.equal(evaluateSkillCoverage(items({1:3,2:4,3:1}),'practice').ready,false,'Practice coverage must retain at least two challenge-difficulty items for the current adaptive bands.');

console.log('Shared commercial content-depth policy checks passed: diagnostic 6/skill, practice 8/skill, and reviewed difficulty floors are enforced independently of session length.');
