# SATprep.io AI Content Review Agent

Updated: 2026-08-28

## Purpose

The AI Content Review Agent is a separate quality-assurance pass for SATprep.io question-bank content. It reviews authored questions without treating the author-provided answer, skill label, exam eligibility, or difficulty label as presumptively correct.

This agent is **not** a human-independent reviewer and its output must never satisfy the production human-review gate by itself. It writes only AI-review fields and human-review priority. It must not write `production_approved`, `qa_status='production_approved'`, or any of the five human approval fields used by the commercial content gate.

## Authoritative alignment basis

The reviewer uses the current public SAT Suite structure represented by `sat-spec.js` and should re-check current College Board public specifications whenever the taxonomy changes. The recognized Reading and Writing domains are Information and Ideas, Craft and Structure, Expression of Ideas, and Standard English Conventions. The recognized Math domains are Algebra, Advanced Math, Problem-Solving and Data Analysis, and Geometry and Trigonometry.

The item-level reviewer must verify the exact skill assignment, not merely the broad section/domain. It must also verify exam eligibility because some Math skills or subskills are SAT-only while others also appear on PSAT/NMSQT and PSAT 10.

## Three-pass architecture

### Pass 1 — Item validity and SAT/PSAT fit

For each item, independently evaluate:

1. **Answer accuracy**
   - Solve or reason through the question without relying on the author explanation.
   - Verify the keyed MCQ answer or every accepted SPR response.
   - Verify the explanation uses valid reasoning and does not introduce a contradiction.
   - For MCQ, confirm exactly one option is defensibly best.

2. **Digital SAT/PSAT alignment**
   - Confirm Reading and Writing versus Math.
   - Confirm official domain and exact skill.
   - Confirm the task type reasonably resembles the reasoning demand of the current digital SAT Suite without copying official source wording.
   - Confirm MCQ/SPR format is permitted for that section and skill.
   - Confirm the exam-eligibility list is not broader than the public specification permits.
   - Reject trivia, specialist knowledge, or school-content demands that are not needed for the tested skill.

3. **Ambiguity and distractors**
   - Detect multiple defensible answers.
   - Detect distractors that are impossible for superficial reasons rather than because of the targeted misconception.
   - Detect answer-length, wording, grammatical, numerical, or pattern clues.
   - Detect duplicated or effectively equivalent choices.

4. **Editorial/accessibility quality**
   - Check concise and unambiguous wording.
   - Check mathematical notation and units.
   - Check whether success depends on unnecessary cultural, financial, regional, or specialist knowledge.
   - Flag stimuli that would require an inaccessible visual unless the product has a valid text/table representation.

### Pass 2 — Difficulty calibration

The author difficulty label is ignored until the reviewer has formed an independent estimate.

The agent assigns one of three provisional classifications:

- **Easy** — direct application or retrieval of one core skill, familiar representation, usually one principal reasoning step, and limited distractor competition.
- **Medium** — interpretation plus application, two linked reasoning steps, a less direct representation, or materially plausible distractors.
- **Hard** — non-obvious structure, multi-step reasoning, synthesis, subtle language/logic, complex representation, or strong competing distractors.

Difficulty is estimated from the cognitive demand of the item, **not** from passage length, large numbers, or the number of words alone. A one-sentence question can be hard if it requires a non-obvious insight; a long context can still be easy if the required operation is direct.

The agent records whether its estimate differs from the author label and assigns a confidence score from 0.00 to 1.00. Any changed difficulty classification or confidence below 0.85 receives at least medium human-review priority.

These labels remain authoring/QA classifications until empirical response data are sufficient for psychometric calibration. The agent must not claim psychometric equivalence to official SAT difficulty.

### Pass 3 — Bank-level portfolio review

After item-level review, the agent evaluates the entire bank for:

- required diagnostic/practice depth by official skill;
- easy/medium/hard distribution;
- Math SPR representation;
- exam-specific coverage;
- over-concentration in one scenario/template family;
- semantic near-duplicates that may not cross the lexical duplicate threshold;
- repeated distractor patterns or keyed-answer patterns;
- excessive reuse of identical explanation language;
- sufficient contextual and representational variety;
- gaps in harder reasoning demands for advanced students.

A bank can therefore pass structural depth while still receive a `revise_portfolio` recommendation if the questions are too templated or the assigned difficulty ladder is not meaningful.

## AI review decisions

Each item receives exactly one:

- `pass_ai_qa` — no material issue found by the AI pass.
- `revise` — usable concept, but wording, answer, alignment, distractors, metadata, or difficulty needs correction.
- `reject` — unsuitable for the bank or materially defective.
- `needs_human_review` — the agent cannot reach a sufficiently confident conclusion.

## Required AI-review output

Each review record must include:

- `item_id`
- `content_hash`
- `ai_review_version`
- `ai_decision`
- `ai_accuracy`
- `ai_alignment`
- `ai_answer_key_valid`
- `ai_ambiguity_flag`
- `ai_section`
- `ai_domain`
- `ai_skill_key`
- `ai_exam_eligibility`
- `author_difficulty`
- `ai_difficulty`
- `difficulty_changed`
- `ai_confidence`
- `human_review_priority`
- `ai_notes`
- `reviewed_at`

The record must be pinned to the exact current `content_hash`. If the item changes, the AI review is stale and must be rerun.

## Separation from production approval

The agent may recommend content for human review, but it may never:

- set `production_approved=TRUE`;
- change an item to `qa_status='production_approved'`;
- fill the five human-review approval columns as though an AI were a human reviewer;
- import or activate a question in production;
- bypass hash validation;
- bypass originality review;
- use public College Board questions as source material for new proprietary items.

## Escalation rules

Human review is `critical` when the answer key appears wrong or the item should be rejected; `high` for ambiguity or required revision; `medium` when the difficulty changes, confidence is below 0.85, or the AI cannot confidently resolve alignment; otherwise `normal`.

The safest operating model is to use this agent to reduce the human-review burden: humans can start with the critical/high/medium queue, while `pass_ai_qa` items still wait for the required human approval before commercial activation.
