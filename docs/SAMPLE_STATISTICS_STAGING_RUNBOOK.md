# SATprep.io Sample Statistics Staging Runbook

Updated: 2026-09-01

This runbook supplements `docs/CONTENT_STAGING_RUNBOOK.md` for the private, unapproved **Inference from Sample Statistics** content pool. It does not authorize human approval, import, activation, publication, or any commercial launch gate.

## Official exam-eligibility boundary

Use the current College Board Digital SAT Suite assessment framework when assigning eligibility:

- **SAT:** sample mean and sample proportion may be used to estimate population mean/proportion; SAT additionally tests interpretation of margin of error and the general relationship between larger sample size and smaller margin of error.
- **PSAT/NMSQT and PSAT 10:** use sample mean and sample proportion to estimate population mean and population proportion. Do **not** tag a question as PSAT/NMSQT or PSAT 10 when the question requires margin-of-error interpretation or the sample-size/margin-of-error relationship.
- `statistical-claims` remains a separate SAT-only skill; do not use observational-study/experiment causality questions merely to increase PSAT coverage for `sample-statistics`.

## Current private expansion state

After the 2026-09-01 coverage repair, the 14 staged `sample-statistics` questions contain:

- **6 shared SAT/PSAT questions:** 4 Easy and 2 Medium items using sample means or sample proportions for population estimation.
- **8 SAT-only questions:** 4 Medium and 4 Hard items preserving margin-of-error and precision coverage.
- **0 production-approved items.** Every question remains `draft_unreviewed` and requires independent human review before any import or activation.

The broader expansion workbook remains 434/434 advisory-AI reviewed with 434 `pass_ai_qa` decisions, 0 AI difficulty changes, and 0 production-approved questions. Advisory AI review is not human approval.

## Authoring and QA rules

1. Preserve useful direct point-estimate questions as Easy anchors.
2. For shared SAT/PSAT Medium items, increase reasoning through a defensible second step (for example, deriving a sample proportion and applying it to the represented population, or using complement reasoning) without introducing margin-of-error content that would make the item SAT-only.
3. Keep SAT-only margin-of-error questions explicit about whether the quantity is a mean or proportion and about whether the reported margin is in units or percentage points.
4. Never broaden PSAT eligibility merely to improve counts. Eligibility follows the tested construct, not the desired bank mix.
5. Maintain a unique answer, realistic distractors, exact units/percentage language, and a clear random-sample basis whenever the inference depends on representativeness.
6. After any content edit, recompute the canonical SHA-256 binding from the stored question values for the entire staging bank and compare it independently with both `Questions.content_hash` and `AI Review.content_hash`.
7. Run exact and near-duplicate screening across the full staging bank at the 0.96 token-Jaccard importer threshold; a change in response format or distractors does not make a duplicated prompt distinct.
8. Keep all revised items `draft_unreviewed`, `production_approved=FALSE`, and outside production content tables until independent human review is complete.

## 2026-09-01 integrity note

A full canonical recomputation after the coverage repair exposed five stale SHA-256 bindings in previously rebuilt `linear-equations-one-variable` items. The question text and advisory AI review already matched; only the stored question/review hashes were stale. The five bindings were repaired, then all 434 staged questions were independently recomputed with **0 canonical mismatches**, **0 question/review hash mismatches**, **0 spreadsheet formula-error values**, and **0 exact or near-duplicate prompt pairs at the 0.96 threshold**. The highest remaining prompt token-Jaccard similarity is approximately 0.933.

## Hard gates

Do not use this staging work to enable live payments, public billing, public indexing, first-party marketing measurement, outbound marketing, external publication, or unreviewed proprietary content. Do not make legal/trademark conclusions or owner-only activation decisions. If the authorized Supabase connection does not expose the SATprep production project, do not use another project as a substitute.
