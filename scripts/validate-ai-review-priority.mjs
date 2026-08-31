import assert from 'node:assert/strict';
import {
  humanReviewPriority,
  isHumanReviewPriorityAtLeastMinimum
} from '../ai-content-review-policy.js';

const normalMinimum = humanReviewPriority({
  decision: 'pass_ai_qa',
  confidence: 0.98,
  difficultyChanged: false,
  ambiguityFlag: false,
  answerKeyValid: true
});
assert.equal(normalMinimum, 'normal');
assert.equal(isHumanReviewPriorityAtLeastMinimum('high', normalMinimum), true,
  'A substantively repaired PASS item may be conservatively escalated to High.');

const mediumMinimum = humanReviewPriority({
  decision: 'pass_ai_qa',
  confidence: 0.98,
  difficultyChanged: true,
  ambiguityFlag: false,
  answerKeyValid: true
});
assert.equal(mediumMinimum, 'medium');
assert.equal(isHumanReviewPriorityAtLeastMinimum('normal', mediumMinimum), false,
  'A difficulty-changed item may not be de-escalated below Medium.');
assert.equal(isHumanReviewPriorityAtLeastMinimum('critical', mediumMinimum), true,
  'Conservative escalation above the minimum must remain valid.');

const criticalMinimum = humanReviewPriority({
  decision: 'reject',
  confidence: 0.99,
  difficultyChanged: false,
  ambiguityFlag: false,
  answerKeyValid: true
});
assert.equal(criticalMinimum, 'critical');
assert.equal(isHumanReviewPriorityAtLeastMinimum('high', criticalMinimum), false,
  'Reject decisions may not be de-escalated below Critical.');
assert.equal(isHumanReviewPriorityAtLeastMinimum('critical', criticalMinimum), true);
assert.equal(isHumanReviewPriorityAtLeastMinimum('unknown', normalMinimum), false,
  'Unknown priority labels fail closed.');

console.log('AI human-review priority floor/escalation regression passed.');
