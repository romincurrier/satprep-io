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

## Production separation

Answer-position staging QA must not modify Supabase commercial content tables, Auth, RLS, billing, public indexing, first-party marketing measurement, outbound marketing, or external publication. If the authorized Supabase connection does not expose the SATprep production project, do not use another project as a substitute. Browser-pilot execution that depends on unavailable production service-only credentials remains a runner/access limitation rather than a product failure.