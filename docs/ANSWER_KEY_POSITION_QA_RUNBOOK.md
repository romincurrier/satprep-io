# SATprep.io Answer-Key Position QA Runbook

Updated: 2026-09-01

This runbook governs answer-position QA for the private SAT/PSAT multiple-choice staging bank. It does not authorize human approval, commercial import, activation, publication, or any other launch-gate change.

## Why this check exists

Correct-answer position is not part of the SAT/PSAT content construct, but severe answer-key concentration can create an avoidable test-taking cue and can make a staged bank less representative of a production-quality assessment. Answer-position QA therefore belongs to content-quality review even when every question is individually correct.

## Required controls

- Keep all affected items `qa_status='draft_unreviewed'` and `production_approved=FALSE` until independent human review is complete.
- Never change the substantive correct answer merely to achieve a letter distribution. Reorder only the existing correct option and distractors while preserving their wording, logic, accessibility, and unique answer key.
- Re-run advisory AI answer-key validity and ambiguity checks after every reorder. AI QA is advisory only and must not be described as human approval.
- Recompute the canonical SHA-256 content hash after every choice reorder and write the same current hash to `Questions.content_hash` and the matching writable `AI Review.content_hash` cell.
- Leave formula-owned `AI Review` columns untouched and preserve all human-review fields.
- Re-read the stored row after each write and confirm that the correct option now occupies the intended position and that the explanation still supports that option without relying on a stale choice letter.
- After each batch, run the normal staging regression: 434 staged / 434 AI-reviewed / 0 remaining, no production-approved expansion item, no spreadsheet errors, full-bank canonical-hash recomputation, question/review hash equality, and duplicate screening at the 0.96 token-Jaccard threshold.
- Canonical verification must be based on the native Google Sheets stored/displayed values. Treat true blank Sheets cells as null for `canonicalReviewContent` semantics; do not treat placeholder values materialized by a secondary workbook importer as source content. When an export/import tool disagrees with the native sheet on a blank cell, verify against the native sheet before changing stored hashes.

## Distribution rule

Evaluate answer positions both across the MCQ bank and within each skill/pool. Do not force exact equality, because question quality takes precedence, but investigate severe concentration, missing answer positions, or long deterministic runs. For a 14-item all-MCQ skill, a practical staging target is roughly 3-4 keys in each position when this can be achieved solely by safe distractor reordering. For skills containing SPR items, apply the same principle to the MCQ subset rather than treating SPR rows as lettered answers.

A choice-order repair is complete only when the substantive correct option is unchanged, its new letter is correctly recorded, the advisory review is freshly rechecked, canonical hashes bind the current stored content, and all hard gates remain closed.

## 2026-09-01 QA cycle

The initial 364-MCQ expansion bank showed a material answer-position skew: A=96, B=134, C=96, D=38. Two especially concentrated skills were repaired without changing question substance:

- `transitions`: A=11, B=2, C=0, D=1 before repair; A=4, B=2, C=4, D=4 after seven safe choice-order reorders.
- `sample-statistics`: A=0, B=10, C=4, D=0 before repair; A=4, B=4, C=3, D=3 after seven safe choice-order reorders.

After those contained repairs, the full 364-MCQ distribution is A=93, B=128, C=99, D=44. The bank-wide B-heavy/D-light pattern therefore remains an open staging-QA item for future contained passes; it is not a reason to alter correct answers, bypass independent review, or activate content. The two repaired skills now have no severe local concentration.

Post-write verification for this cycle confirmed 434/434 staged items remain `draft_unreviewed`, 0/434 are production-approved, 434/434 advisory reviews remain `pass_ai_qa`, advisory difficulty remains 124 Easy / 186 Medium / 124 Hard with zero difficulty-change flags, question/review hashes match, canonical recomputation is valid across all 434 items when true blank Google Sheets cells are treated as null, no spreadsheet formula errors are present, and no stimulus/stem pair reaches the 0.96 duplicate threshold (maximum observed similarity approximately 0.933).

## 2026-09-01 Command of Evidence (Quantitative) follow-up

A second contained answer-position pass found `command-evidence-quantitative` concentrated at A=10, B=2, C=1, D=1. Six unapproved items were repaired solely by reordering their existing choices: three correct options moved from A to C and three from A to D. No substantive answer, distractor wording, stimulus, stem, construct, exam eligibility, or difficulty was changed. The skill now stands at A=4, B=2, C=4, D=4.

Each reordered item received a fresh advisory AI answer-key and ambiguity recheck and remains `pass_ai_qa`; AI review is not human approval. Post-write native-sheet verification confirms 434/434 items remain `draft_unreviewed`, 0/434 are production-approved, 434/434 advisory reviews remain PASS, difficulty remains 124 Easy / 186 Medium / 124 Hard with zero difficulty-change flags, all 434 canonical SHA-256 hashes bind the current native-sheet content and match the corresponding AI-review hash, and no spreadsheet-error value is present. A full stimulus/stem duplicate screen still finds 0 pairs at or above the 0.96 token-Jaccard threshold, with maximum observed similarity approximately 0.933. The full 364-MCQ distribution is now A=87, B=128, C=102, D=47, so the broader B-heavy/D-light pattern remains an open staging-QA item for future contained passes.

During verification, a secondary XLSX importer materialized true blank cells as placeholder strings and falsely suggested five stale hashes in `linear-equations-one-variable`. Native Google Sheets values showed those cells were blank and the original five hashes were correct; the temporary diagnostic hash writes were immediately reverted before completion. This runner/tooling discrepancy did not change question content or review status and is now explicitly guarded by the native-sheet verification rule above.

## 2026-09-01 Systems of Linear Equations follow-up

A subsequent contained pass found the 10-MCQ subset of `systems-linear-equations` concentrated at A=0, B=2, C=6, D=2. Three unapproved items were repaired solely by reordering their existing answer choices: two correct options moved from C to A and one moved from C to B. No stimulus, stem, substantive correct answer, distractor wording, explanation, construct, exam eligibility, or difficulty was changed. The MCQ subset now stands at **A=2, B=3, C=3, D=2**.

All three reordered items received fresh advisory AI answer-key and ambiguity rechecks and remain `pass_ai_qa`; the review remains advisory and is not human approval. New canonical SHA-256 bindings were independently recomputed and written identically to the question and advisory-review rows, and immediate native-sheet readback confirmed the intended choices, letters, hashes, `draft_unreviewed` status, and `production_approved=FALSE` state.

Full-bank regression after the repair confirms **434 staged / 434 advisory-AI reviewed / 434 PASS / 0 remaining**, **0 production-approved expansion items**, **0 authored-versus-AI difficulty-change flags**, and the unchanged advisory difficulty mix of **124 Easy / 186 Medium / 124 Hard**. All 434 question/review hashes match. Independent canonical recomputation across the exported bank resolves to 0 mismatches when the already documented native-Sheets blank/null rule is applied; the secondary XLSX path again materialized some true blank cells as placeholder values, so native Sheets remains authoritative for blank-cell semantics. No spreadsheet error value is present, and the full stimulus/stem duplicate screen remains at **0 pairs at or above 0.96 token-Jaccard**, with maximum observed similarity approximately **0.933**. Because only option order changed, prompt-level duplicate similarity is substantively unchanged.

The full 364-MCQ answer-position distribution is now **A=89, B=129, C=99, D=47**. The broader B-heavy/D-light skew remains an open staging-QA item for future contained passes; it must continue to be reduced only through safe choice ordering and never by changing substantive answers or bypassing independent review.

## 2026-09-01 Ratios, rates, proportional relationships, and units follow-up

A later staging-quality pass found two separate issues in `ratios-rates-units`. First, its 10-MCQ subset was concentrated at **A=0 / B=4 / C=6 / D=0**. Second, the Easy practice pool repeated the same machine-parts unit-rate template already used in the diagnostic pool closely enough to reduce construct/context variety even though the pairs remained below the 0.96 importer threshold. The content-variety repair was governed by `docs/CONTENT_STAGING_RUNBOOK.md`, not performed merely to change answer letters: the two repetitive unapproved Easy practice drafts were rebuilt as distinct unit-price and mixture-ratio items while preserving skill, difficulty, exam eligibility, staging status, and the independent-human-review requirement. Fresh advisory AI checks support both as accurate, unambiguous Easy items.

After those two substantive staging-only repairs, two additional existing MCQs were safely reordered without changing their substance: the scale-map item moved its correct option from C to A, and the miles-to-feet rate item moved its correct option from C to D. The 10-MCQ subset now stands at **A=2 / B=4 / C=2 / D=2**, eliminating the missing A/D positions and the prior C concentration. The full 364-MCQ expansion distribution is now **A=91 / B=129 / C=95 / D=49**; the remaining B-heavy pattern stays open for later contained QA and is not a basis for changing substantive answers.

All four touched items received fresh advisory AI answer-key and ambiguity review and remain `pass_ai_qa`; none is represented as human-approved. Each changed row was rebound to an independently recomputed canonical SHA-256 hash, and immediate native-sheet readback confirmed the current content, correct letter, matching advisory-review hash, `draft_unreviewed` state, and `production_approved=FALSE` state.

The same full-bank audit also found one genuine stale paired hash on `satp-cd2-20260828-two-variable-data-practice-05`. The stored Questions and AI Review hashes matched each other, but independent canonical recomputation from the current native content produced `51f06ee867d6d44fc306cb66750fa07188782b350b8acc50c8072877ec700175`. The existing advisory review accurately described the current exponential paired-data item, so only the two stale hash cells were rebound; no question content, verdict, difficulty, approval state, or review conclusion changed.

Post-repair regression confirms **434 staged / 434 advisory-AI reviewed / 434 PASS / 0 remaining**, **0 production-approved expansion items**, **0 authored-versus-AI difficulty changes**, and the unchanged advisory difficulty mix of **124 Easy / 186 Medium / 124 Hard**. Independent canonical recomputation resolves to **0/434 stale hashes** after applying native Sheets blank/null semantics to the five previously documented exporter-placeholder rows, and there are **0 question/review hash mismatches**. The workbook error scan found 0 spreadsheet-error values. A full stimulus/stem duplicate screen still finds **0 pairs at or above the 0.96 token-Jaccard threshold**, with maximum observed similarity approximately **0.933**.

## 2026-09-01 Linear equations in two variables follow-up

The next contained staging pass found the 10-MCQ `linear-equations-two-variables` subset concentrated at **A=6 / B=3 / C=1 / D=0**. Three unapproved items were repaired solely by reordering their existing answer choices: the museum-workshop modeling item moved its key from A to D, the three-point linear-representation item moved its key from A to D, and the intercept-coefficient item moved its key from A to C. No stimulus, stem, substantive correct answer, distractor wording, explanation, construct, exam eligibility, or difficulty changed. The subset now stands at **A=3 / B=3 / C=2 / D=2**.

All three reordered items received fresh advisory AI answer-key and ambiguity rechecks and remain `pass_ai_qa`; the review remains advisory and is not human approval. New canonical SHA-256 bindings were independently recomputed and written identically to the question and advisory-review rows, and immediate native-sheet readback confirmed the intended choices, new letters, hashes, `draft_unreviewed` status, and `production_approved=FALSE` state.

Full-bank regression after the repair confirms **434 staged / 434 advisory-AI reviewed / 434 PASS / 0 remaining**, **0 production-approved expansion items**, **0 authored-versus-AI difficulty-change flags**, and the unchanged advisory difficulty mix of **124 Easy / 186 Medium / 124 Hard**. Native first-sheet CSV export preserves the Google Sheets blank/null semantics and independently recomputes **0/434 stale canonical hashes**; all 434 question hashes match the corresponding advisory-review hashes. The workbook error scan found 0 spreadsheet-error values. A full stimulus/stem duplicate screen still finds **0 pairs at or above the 0.96 token-Jaccard threshold**, with maximum observed similarity approximately **0.933**. Because this repair changed only answer choice order, prompt-level duplicate similarity is unchanged.

The full 364-MCQ expansion distribution is now **A=88 / B=129 / C=96 / D=51**. The broader B-heavy pattern remains an open staging-QA item for future contained passes; it must continue to be reduced only through safe choice ordering and never by changing substantive answers or bypassing independent review.

## Production separation

Answer-position staging QA must not modify Supabase commercial content tables, Auth, RLS, billing, public indexing, first-party marketing measurement, outbound marketing, or external publication. If the authorized Supabase connection does not expose the SATprep production project, do not use another project as a substitute. Browser-pilot execution that depends on unavailable production service-only credentials remains a runner/access limitation rather than a product failure.