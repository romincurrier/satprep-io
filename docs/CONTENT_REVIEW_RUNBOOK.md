# SATprep.io Independent Content Review Runbook

Purpose: prevent unreviewed or stale SAT/PSAT questions from being treated as launch-ready content.

## Release principle
Automated validation checks structure, taxonomy, answer-key shape, coverage, duplicate IDs, duplicate text, and other machine-verifiable rules. It does **not** replace independent human review. A question is commercially releasable only when its current content hash has independent approvals for accuracy, SAT/PSAT alignment, editorial quality, bias/accessibility, and originality.

## Reviewer roles
A single qualified reviewer may complete all five fields for an item, but launch review is stronger when content/assessment accuracy and editorial/accessibility review are separated. The reviewer should not rely on the author’s explanation as proof that the answer key is correct.

Recommended minimum qualifications:
- Strong command of the tested Math or Reading and Writing skill.
- Familiarity with the current digital SAT Suite structure and public College Board specifications.
- Ability to verify distractors, not only the keyed answer.
- Ability to identify ambiguous language, accessibility problems, unnecessary cultural assumptions, and accidental similarity to protected source material.

## Review workflow
1. Pull the exact launch-candidate commit.
2. Run `npm run content:review-export`.
3. Open the generated review file in a spreadsheet application.
4. Review every item without changing the item text inside the review file.
5. Complete `reviewer` and `reviewed_at`.
6. Mark each review dimension `APPROVE`, `REVISE`, or `REJECT`.
7. Add actionable notes for every `REVISE` or `REJECT` decision.
8. Save the completed file without changing `content_hash`, `content_type`, or `item_id`.
9. Run `npm run content:review-validate -- <completed-review-file>`.
10. Correct any structural review-file errors.
11. If the validation contains revisions or rejections, edit the source question, rebuild, re-export, and re-review the changed item. Do not reuse the old approval after a content change.
12. Once reviewed items are approved, run `npm run content:review-apply` to update `content-approval-registry.json` from the validated review artifact.
13. Commit the registry change alongside the approved launch candidate.
14. Run `npm run build` and `npm run content:readiness -- --strict` before a content release decision.

## Review dimensions
### Accuracy review
Approve only if:
- exactly one answer is defensibly correct for an MCQ;
- the keyed answer is correct;
- all calculations, data interpretation, grammar rules, and textual reasoning are correct;
- the explanation reaches the answer through valid reasoning;
- no needed information is missing.

### SAT/PSAT alignment review
Approve only if:
- the official skill assignment is appropriate;
- the task resembles the reasoning demand of the current digital SAT Suite without copying official wording;
- the difficulty label is reasonable relative to the bank;
- the item is eligible for every exam listed in its metadata;
- the item is not testing irrelevant trivia or off-spec knowledge.

### Editorial review
Approve only if:
- the stem is clear and concise;
- answer choices are grammatically parallel when appropriate;
- there are no accidental clues, duplicated choices, or formatting errors;
- the explanation teaches the intended method without introducing contradictions;
- notation and terminology are consistent.

### Bias/accessibility review
Approve only if:
- success does not depend on unnecessary cultural, regional, financial, or specialist background knowledge;
- names, contexts, and examples do not rely on stereotypes;
- the language is accessible without making the tested reasoning artificially easy;
- charts/tables or other representations can be made accessible in the product UI;
- no distractor depends on a disability-related trap unrelated to the tested skill.

### Originality review
Approve only if:
- the item is SATprep.io-original;
- the wording does not reproduce a College Board question or another publisher’s protected item;
- any common mathematical setup is expressed independently;
- the item does not appear to be a lightly paraphrased version of a known source question.

## Hash-pinned approval behavior
`content-approval-registry.json` stores approval against the SHA-256 hash of the exact reviewed content. The production build validates every stored approval. If the stem, stimulus, choices, answer key, explanation, taxonomy, difficulty, or exam eligibility changes, the hash changes and the build fails until the item is re-reviewed or the stale approval is removed.

This prevents a reviewed question from being edited later while silently retaining an old approval.

## Commercial release threshold
The current readiness script uses development depth targets of:
- at least 6 diagnostic items per official skill;
- at least 8 practice items per official skill;
- at least 4 independently approved diagnostic and 4 independently approved practice items per official skill.

These are release-engineering thresholds, not claims about psychometric equivalence to the SAT. They can be raised as calibration data and content inventory grow.

## Diagnostic-specific rule
The initial diagnostic remains assessment-only. Do not show the answer key, correctness, or explanation while the diagnostic is in progress. Review explanations are retained for internal QA, but they are not delivered to the diagnostic client.

## Practice-specific rule
Practice/learning sessions should provide correctness feedback, the correct answer, and a useful explanation after submission. Explanations should teach a reusable process rather than merely restating the answer.

## Final launch sign-off
Before public launch, record the commit SHA that passed:
- content structural validation;
- hash-pinned approval validation;
- strict content-readiness review;
- end-to-end diagnostic/practice regression;
- security validation;
- SEO validation;
- deployment smoke testing.

Do not promote a later commit under the earlier sign-off unless the launch validation suite is rerun.
