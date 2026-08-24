# SATprep.io Proprietary Content Authoring Standard

Version: 1.0 (2026-08-24)

Purpose: define the minimum standard for SATprep.io-authored diagnostic, learning, and practice items. This standard is intentionally stricter than "looks like an SAT question." Commercial content must be original, skill-valid, answerable from the information given, instructionally useful, and reviewed before production approval.

## 1. Source and copyright rule
- SATprep.io items must be original SATprep.io content.
- Public College Board test specifications and official practice are used to understand tested constructs, formats, pacing, and quality expectations.
- Do not copy, scrape, lightly rewrite, or create close paraphrases of protected official questions.
- Do not reproduce a distinctive official passage, table, scenario, answer set, numerical structure, or distractor pattern merely by swapping names/numbers.
- If a reviewer recognizes an item as substantially traceable to a particular official question, mark originality `REVISE` or `REJECT`.

## 2. Required item metadata
Every item must include:
- stable item ID;
- version;
- origin = SATprep.io original;
- section (`RW` or `MATH`);
- official domain key;
- official skill key;
- difficulty 1–3;
- eligible exam(s);
- format (`mcq`, and only approved student-produced-response formats where supported);
- stimulus if needed;
- stem;
- four answer choices for MCQ;
- correct answer key;
- instructional explanation;
- estimated response time;
- QA status.

Production content additionally requires a review record bound to the exact content hash.

## 3. Construct validity
An item should primarily measure the skill it is tagged to measure.

Reject or revise when:
- another skill is more central than the tagged skill;
- success depends mainly on obscure outside knowledge;
- the item combines so many demands that failure cannot be interpreted;
- wording difficulty, unnecessary calculation, or cultural knowledge overwhelms the intended construct;
- multiple answers can reasonably be defended;
- the answer is discoverable through a formatting or grammar clue unrelated to the tested skill.

Diagnostic items require especially clean construct focus because the response is used as evidence in the learning model.

## 4. Reading and Writing item standard
### Stimulus
- Use concise, self-contained passages appropriate to the current digital SAT's short-passage format.
- Use original prose or clearly public-domain/factual source material only when rights are unambiguous.
- Avoid dependence on specialist knowledge not provided by the text.
- For scientific/historical content, factual statements should be plausible and internally consistent; real factual claims should be checked when presented as real rather than hypothetical.
- Tables must have clear labels, units, and enough data to support exactly one answer.

### Information and Ideas
- Central ideas/details: correct answer captures the controlling idea or requested detail without overclaiming.
- Evidence: correct answer must directly support the stated claim; distractors may be true but irrelevant, partially supportive, or overbroad.
- Inference: answer must be logically supported, not merely possible.

### Craft and Structure
- Words in context: tested word must have a context-dependent meaning; choices should be semantically plausible enough to require context.
- Text structure/purpose: ask about function or organization that can be established from the text itself.
- Cross-text connections: both texts must contribute; avoid a question answerable from only one text unless that is the stated task.

### Expression of Ideas
- Rhetorical synthesis: notes must include both relevant and irrelevant information; the writing goal controls selection.
- Transitions: relationship must be unambiguous (cause, contrast, addition, example, sequence, concession, etc.).

### Standard English Conventions
- Boundary questions must genuinely test clause/sentence relationships rather than stylistic preference.
- Form/structure/sense must have one conventionally correct option in context.
- Avoid dialect-based judgments unrelated to the Standard English construct.

## 5. Math item standard
### General
- The problem must be solvable from the provided information.
- Numerical values should be chosen deliberately; avoid needless arithmetic that obscures the skill.
- Units and precision must be explicit where relevant.
- Diagrams, when introduced, must not create unintended scale assumptions unless the task explicitly permits them.
- Distractors should represent interpretable mistakes rather than random numbers.

### Algebra
- Linear equation/function/system/inequality items should test modeling, representation, manipulation, or interpretation appropriate to the tagged skill.
- Avoid making a supposedly advanced item difficult only by adding arithmetic clutter.

### Advanced Math
- Equivalent-expression and nonlinear items should require structural reasoning appropriate to polynomials, quadratics, exponentials, radicals, or related functions.
- Check domain restrictions and extraneous solutions where relevant.

### Problem-Solving and Data Analysis
- Ratios/rates/percent items must identify the correct reference/base quantity.
- Data/statistics items must distinguish description, inference, association, and causation accurately.
- Probability conditionality must be clear.
- Experimental-design questions must use random assignment/sampling terminology correctly.

### Geometry and Trigonometry
- State enough dimensions/relationships to make the figure determinate.
- Use exact versus approximate answers consistently.
- Trigonometric conventions and angle units must be explicit where ambiguity is possible.

## 6. Difficulty definition
Difficulty is not a guarantee of population p-value until empirical data exists. Pre-launch difficulty is an editorial rating:

### Difficulty 1 — foundational
- one principal reasoning step or familiar relationship;
- direct wording;
- limited distractor complexity.

### Difficulty 2 — standard
- multiple connected steps, translation/modeling, or a more competitive distractor set;
- requires choosing the right process before executing it.

### Difficulty 3 — advanced
- non-obvious structure, multi-representation reasoning, nuanced textual distinction, or a distractor set designed around credible misconceptions;
- should not become "hard" through obscurity, trick wording, or excessive computation.

After sufficient response data, editorial difficulty should be compared with empirical item difficulty and revised where needed.

## 7. Distractor standard
Each incorrect choice should be wrong for a specific, defensible reason.

Preferred distractor sources:
- common arithmetic/algebra error;
- wrong reference quantity;
- correct calculation for the wrong requested quantity;
- text detail that is true but does not answer the question;
- inference that is possible but unsupported;
- overly broad/absolute conclusion;
- wrong logical transition relationship;
- punctuation/grammar choice that reflects a common structural mistake.

Avoid:
- absurd or joke choices;
- repeated near-synonyms that create accidental ambiguity;
- one unusually long or polished choice that signals the key;
- distractors that become correct under a reasonable reading of the stem.

## 8. Explanation standard
A practice explanation must teach the reusable process, not merely restate the answer.

Minimum requirements:
1. identify the decisive rule/evidence/relationship;
2. show the reasoning or calculation needed to reach the answer;
3. state the correct result;
4. when useful, briefly explain the trap behind a strong distractor.

Good Math explanation example structure:
- identify formula/relationship;
- substitute/transform;
- calculate;
- interpret units/answer.

Good Reading and Writing explanation structure:
- state what the task is asking;
- point to the controlling evidence/rule;
- explain why the correct choice fits;
- distinguish it from the tempting overreach/error when useful.

Diagnostic explanations may be stored server-side but are not delivered during assessment.

## 9. Accessibility and bias review
Review every item for unnecessary barriers independent of the tested skill.

Check:
- names/settings do not rely on stereotypes;
- socioeconomic assumptions are not necessary to solve the item;
- disability, race, religion, nationality, gender, family structure, or other identity details are not used gratuitously;
- contexts are understandable without niche U.S. cultural knowledge unless explained;
- language is concise and avoids unnecessary idiom;
- tables and textual descriptions remain usable with assistive technology;
- symbols and units are represented consistently;
- color is never the only carrier of required information.

Content involving sensitive topics needs an affirmative editorial reason and heightened review.

## 10. Diagnostic-specific rules
- No practice item currently exposed to the learner should duplicate a live diagnostic item.
- Diagnostic item IDs and sequence are server-managed.
- The browser receives only the current unanswered prompt/choices.
- No answer key or explanation is delivered during the diagnostic.
- Submitted answers are immutable and retry-safe.
- A diagnostic item should be sufficiently focused that its result can contribute meaningfully to a skill estimate.
- Avoid repeated exposure of the same item to the same learner when bank depth allows rotation.

## 11. Practice-specific rules
- Immediate feedback is expected after submission.
- The correct answer and explanation must be visible in the learning context.
- Practice should include enough variation that mastery cannot be achieved by memorizing a single item form.
- A skill session should progress from understanding to targeted practice to mixed/transfer practice over time.

## 12. Review gate
Independent review categories:
- `accuracy_review`
- `alignment_review`
- `editorial_review`
- `bias_accessibility_review`
- `originality_review`

Allowed decisions: `APPROVE`, `REVISE`, `REJECT`.

Rules:
- all required dimensions must be approved for production eligibility;
- reviewer and review date are required;
- a content hash binds review to the exact item version;
- any material edit requires a new hash and fresh review;
- `REVISE` returns the item to editing; `REJECT` removes it from promotion consideration unless substantially rewritten and re-reviewed.

Psychometric review is a separate later gate once sufficient real response data exists.

## 13. Empirical item-quality monitoring after launch
Once legally collected, privacy-reviewed response volume is sufficient, monitor at aggregate/item level:
- exposure count;
- percent correct;
- response-time distribution;
- omission/timeout rates;
- distractor selection distribution;
- performance by prior estimated mastery band;
- unusual shifts after item edits;
- possible ambiguity indicators (strong students splitting between two options);
- differential item functioning only with an appropriately designed, legally/privacy-reviewed methodology and sufficient sample sizes.

Do not use small samples to make strong psychometric claims.

## 14. Calibration / score-claim boundary
SATprep.io diagnostic mastery is not an official SAT/PSAT score.

Before publishing any score-equivalence or predicted-score claim, require:
- a predefined calibration methodology;
- sufficient sample size across score ranges;
- recent official test/practice criterion data collected with permission/appropriate consent;
- held-out validation;
- error intervals rather than false precision;
- ongoing recalibration when test specifications or bank composition changes;
- independent psychometric review.

Until then, report skill priorities, mastery/readiness evidence, and progress without representing those values as College Board scaled scores.

## 15. Current official-specification maintenance
At least annually—and whenever College Board announces material changes—recheck:
- section timing/question counts;
- domains and tested skills;
- calculator policy and item formats;
- SAT vs PSAT/NMSQT/PSAT 10 eligibility differences;
- public test specifications.

Record the date/specification version used by the content system.
