// SATprep.io AI question-bank review policy.
// This is an automated QA rubric, not a human-independent approval mechanism.
// It must never write production approval state or substitute for required human review.

export const AI_REVIEW_VERSION = 'satprep-ai-review-v1';

export const AI_REVIEW_DECISIONS = Object.freeze([
  'pass_ai_qa',
  'revise',
  'reject',
  'needs_human_review'
]);

export const DIFFICULTY_LEVELS = Object.freeze(['easy', 'medium', 'hard']);

export const ITEM_REVIEW_DIMENSIONS = Object.freeze({
  accuracy: {
    weight: 30,
    description: 'Verify the keyed answer, calculations or textual reasoning, explanation, and sufficiency of information.'
  },
  sat_psat_alignment: {
    weight: 25,
    description: 'Verify section, official domain/skill, response format, exam eligibility, and that the reasoning demand fits the current digital SAT Suite.'
  },
  ambiguity_distractors: {
    weight: 15,
    description: 'Check for one defensible MCQ answer, plausible but wrong distractors, accidental clues, overlap, and ambiguity.'
  },
  editorial_accessibility: {
    weight: 10,
    description: 'Check clarity, concise wording, notation, accessibility, unnecessary background knowledge, and avoidable cultural assumptions.'
  },
  difficulty_calibration: {
    weight: 20,
    description: 'Estimate easy/medium/hard from reasoning demand, abstraction, representation complexity, distractor strength, and likely time pressure.'
  }
});

export const DIFFICULTY_RUBRIC = Object.freeze({
  easy: Object.freeze({
    score: 1,
    description: 'Direct application or retrieval of one core skill; familiar representation; typically one principal reasoning step; weak-to-moderate distractor competition.'
  }),
  medium: Object.freeze({
    score: 2,
    description: 'Requires interpretation plus application, two linked reasoning steps, a less direct representation, or materially plausible distractors.'
  }),
  hard: Object.freeze({
    score: 3,
    description: 'Requires non-obvious structure, multi-step reasoning, synthesis, subtle language/logic, complex representation, or strong competing distractors.'
  })
});

export const REVIEW_OUTPUT_FIELDS = Object.freeze([
  'item_id',
  'content_hash',
  'ai_review_version',
  'ai_decision',
  'ai_accuracy',
  'ai_alignment',
  'ai_answer_key_valid',
  'ai_ambiguity_flag',
  'ai_section',
  'ai_domain',
  'ai_skill_key',
  'ai_exam_eligibility',
  'author_difficulty',
  'ai_difficulty',
  'difficulty_changed',
  'ai_confidence',
  'human_review_priority',
  'ai_notes',
  'reviewed_at'
]);

export function humanReviewPriority({decision, confidence, difficultyChanged, ambiguityFlag, answerKeyValid}) {
  if (decision === 'reject' || answerKeyValid === false) return 'critical';
  if (decision === 'revise' || ambiguityFlag === true) return 'high';
  if (decision === 'needs_human_review' || difficultyChanged === true || Number(confidence) < 0.85) return 'medium';
  return 'normal';
}

export function canEverCountAsHumanApproval() {
  return false;
}
