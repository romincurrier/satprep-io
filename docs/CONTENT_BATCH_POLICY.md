# SATprep.io Commercial Content Batch Policy

Updated: 2026-09-07

## Batch A

Batch A contains every commercial SAT/PSAT question authored before the first external human reviewer receives a calibration/review file.

Batch A is currently OPEN. The private staging bank contains 558 items labeled `review_batch=A`: 198 Reading & Writing and 360 Math. Two 31-item practice expansions on 2026-09-07 followed the prior 496-item checkpoint. All 31 tracked skills now have 7 diagnostic and 11 practice questions. Additional questions authored before the external calibration cutoff also belong to Batch A.

All items remain `draft_unreviewed` and `production_approved=FALSE`. After the latest expansion, all 558 canonical hashes were recomputed from live displayed staging values and matched the separately read human-review queue and AI-review hashes. Importer-equivalent exact and near-duplicate screening found 0 pairs at the 0.96 threshold; maximum importer-equivalent similarity is 0.90625. Same-skill prompt-only maximum is 0.9333333333. The bank contains 468 MCQ and 90 Math SPR items, preserving a 25% SPR share within Math. MCQ positions are exactly balanced: A=117, B=117, C=117, D=117. Provisional difficulty counts are 166 Easy, 231 Medium and 161 Hard. All 558 have advisory AI QA, with 0 human approvals and 0 release-eligible items. AI QA does not satisfy the human-review gate.

Immediately before the first external calibration file is shared:

1. Freeze Batch A.
2. Record the freeze timestamp and final item count.
3. Recompute and verify every canonical content hash.
4. Run within-bank and cross-bank duplicate/near-duplicate screening.
5. Do not add or silently revise Batch A items without generating a new content hash and returning the revised item through the human-review gate.

## Batch B and later

Any commercial question authored after Batch A freezes is Batch B (or a later explicitly assigned batch). Batch B content must remain separate in review reporting so reviewer/test evidence cannot be incorrectly attributed to content that did not exist when testing began.

Every batch is subject to the same rules:

- AI review is advisory only.
- Unreviewed content remains `draft_unreviewed` and not production approved.
- Human approval binds to the exact current content hash.
- Any substantive change invalidates prior human approval for that item version.
- Import to the runtime commercial content tables occurs only after the independent human-review gate and remains inactive until production verification and acceptance testing are complete.

## Database field

`public.content_items.review_batch` records the batch on future reviewed imports. The runtime table remains empty until the commercial human-review/import gate is satisfied. The private staging spreadsheet is the current source of truth for unreviewed question text.
