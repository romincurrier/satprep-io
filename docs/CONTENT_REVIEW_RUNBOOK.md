# SATprep.io Independent Content Review Runbook

Purpose: prevent unreviewed or stale SAT/PSAT questions from being treated as launch-ready content.

## Release principle
Automated validation checks structure, taxonomy, answer-key shape, coverage, duplicate IDs, duplicate text, and other machine-verifiable rules. It does **not** replace independent human review. A question is commercially releasable only when its current content hash has independent approvals for accuracy, SAT/PSAT alignment, editorial quality, bias/accessibility, and originality.

For secure production diagnostics there are now **two separate hash gates**:
1. the repository approval registry pins reviewed authoring content to an exact SHA-256 hash; and
2. the server-only production content system recomputes the exact current database item hash at runtime and requires every current diagnostic approval row to match it before the item can be selected, delivered, or scored.

An item that changes after review must therefore fail closed even if its database row still says `production_approved`.

## Reviewer roles
A single qualified reviewer may complete all five fields for an item, but launch review is stronger when content/assessment accuracy and editorial/accessibility review are separated. The reviewer should not rely on the author’s explanation as proof that the answer key is correct. A reviewer approving originality must not treat machine-generated similarity checks as a substitute for human source/originality judgment.

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
15. For secure diagnostic release, import only fresh post-private-boundary diagnostic content into the server-only content tables. The import must carry the exact reviewed `content_hash` into each required `content_item_reviews` approval row.
16. Recompute the production hash from the imported prompt metadata, answer key, and explanation before activation. Do not hand-edit the database hash to make a review pass.
17. Run `npm run verify:live-content` against the expected live SATprep.io project to report exact-hash approved depth by exam, skill, difficulty, and response format. Use `npm run verify:launch-content` for the strict launch gate.
18. Verify that `/api/diagnostic-session-v3`, `/api/diagnostic-item-v3`, `/api/diagnostic-answer-v3`, `/api/practice-session-v3`, `/api/practice-item-v3`, and `/api/practice-answer-v3` fail closed if required current review or commercial depth requirements are not satisfied.

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
`content-approval-registry.json` stores authoring approval against the SHA-256 hash of the exact reviewed content. The production build validates every stored approval. If the stem, stimulus, choices, answer key, explanation, taxonomy, difficulty, or exam eligibility changes, the hash changes and the build fails until the item is re-reviewed or the stale approval is removed.

The secure diagnostic and commercial practice runtimes apply the same principle independently inside the server-only database. They reconstruct a canonical object from the current `content_items` row plus the current `content_answer_keys` answer and explanation, hash that exact object with SHA-256, and require the latest approval for each required runtime review type to contain that same hash. Delivery and scoring both perform this check.

This means:
- changing a prompt after review invalidates approval;
- changing the keyed answer after review invalidates approval;
- changing the explanation after review invalidates approval;
- changing skill/domain/difficulty/exam eligibility after review invalidates approval;
- a later `revise` or `reject` decision overrides an older approval;
- manually leaving `qa_status='production_approved'` cannot bypass the runtime review gate.

## Production import rule
The public application repository has historically exposed development assessment content. Those historical diagnostic items are not eligible to become secure commercial diagnostic content merely by adding review hashes later.

After a private proprietary-content boundary is established, fresh diagnostic items should be imported through a controlled server-side process that:
- assigns fresh item IDs;
- inserts prompt metadata into `content_items`;
- inserts answer/explanation material into `content_answer_keys`;
- records independent review decisions with the exact SHA-256 `content_hash` in `content_item_reviews`;
- activates an item only after all required current approvals are present;
- never writes secure answer keys into browser-delivered source.

## Commercial release threshold
The shared commercial content policy now requires, for every eligible official skill/exam combination:
- at least **6 exact-hash approved diagnostic items per skill**, with approved inventory represented at difficulty 1, 2, and 3;
- at least **8 exact-hash approved practice items per skill**;
- within those approved practice items, at least **2 difficulty-1, 3 difficulty-2, and 2 difficulty-3** items, plus at least one additional approved item at any supported difficulty to reach the eight-item rotation floor.

A guided-practice session currently uses 5 items. The 8-item practice requirement is intentionally larger than a single session so repeat practice can rotate content while retaining enough inventory to satisfy foundation, balanced, and challenge adaptive difficulty patterns. Math practice targets approximately 25% SPR in a five-item session when the approved pool supports that format mix; Reading and Writing remains MCQ.

These are release-engineering thresholds, not claims about psychometric equivalence to the SAT. They can be raised as calibration data and content inventory grow. Difficulty labels must be treated as reviewed authoring classifications until empirical calibration supports stronger claims.

## Diagnostic-specific rule
The initial diagnostic remains assessment-only. Do not show the answer key, correctness, or explanation while the diagnostic is in progress. Review explanations are retained for internal QA and runtime hash integrity, but they are not delivered to the diagnostic client.

## Practice-specific rule
Practice/learning sessions should provide correctness feedback, the correct answer, and a useful explanation after submission. Explanations should teach a reusable process rather than merely restating the answer. New commercial practice sessions must fail closed if the approved server-only bank for the requested skill is below the shared depth/difficulty policy; a five-item minimum alone is not sufficient for commercial mode.

## Final launch sign-off
Before public launch, record the commit SHA that passed:
- content structural validation;
- hash-pinned approval validation;
- shared commercial content-policy regression;
- strict authoring content-readiness review;
- strict live runtime database content-readiness verification;
- end-to-end diagnostic/practice regression;
- security validation;
- SEO validation;
- deployment smoke testing.

Do not promote a later commit under the earlier sign-off unless the launch validation suite is rerun.
