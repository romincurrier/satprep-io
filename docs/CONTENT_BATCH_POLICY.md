# SATprep.io Commercial Content Batch Policy

Updated: 2026-09-06

## Batch A

Batch A contains every commercial SAT/PSAT question authored before the first external human reviewer receives a calibration/review file.

Batch A is currently OPEN. The private staging bank now contains 465 items labeled `review_batch=A`: the prior 434-item bank plus a 31-item 2026-09-06 expansion that added one new practice item across each of the 31 tracked skills. Additional questions authored before the external calibration cutoff are also Batch A.

The 2026-09-06 expansion remains `draft_unreviewed` and `production_approved=FALSE`. Its canonical hashes were recomputed from the exported staging file and matched 31/31 items. Importer-equivalent exact duplicate screening found 0 duplicates, and near-duplicate screening at the production importer threshold of 0.96 found 0 pairs. The combined 465-item bank contains 390 MCQ and 75 SPR items; cumulative MCQ answer positions are A=96, B=102, C=96, D=96. AI QA is advisory only and does not satisfy the human-review gate.

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
