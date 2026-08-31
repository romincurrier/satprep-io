# SATprep.io Autonomous Readiness Log

This additive log records autonomous commercial-readiness work without replacing `COMMERCIAL_LAUNCH_CHECKLIST.md`. The checklist remains the launch authority; this log captures verified work between checklist consolidations.

## 2026-08-30

### Production and safety

- Production deployment was inspected before changes.
- A test-harness authorization gap was found in `api/full-browser-self-pilot-direct.js`: the direct runner depended on internal auto mode plus a `vercel-cron` user-agent check but did not independently require the one-time pilot capability already enforced by the wrapper.
- The direct runner now requires a valid 64-hex `run_key`, binds it to exactly one fresh service-only `pilot_enrollments` record by `token_hash`, and also requires `metadata.self_browser_pilot=true`.
- `scripts/validate-self-pilot-direct.mjs` now rejects regression of that capability binding.
- The fix was preview-validated, reviewed in PR #2, squash-merged to `main`, and deployed to production as commit `af2341e6f4eeb469ad78b5913ac6458e386be8ef`.
- The merged production build passed the complete content, pilot, security, privacy, accessibility, RLS, launch, regression, billing, secret-boundary, diagnostic, practice, learning-authority, parent-progress, and admin-operation validator suite.
- Public indexing, public billing, live payments, first-party marketing measurement, outbound marketing, external publishing, and unreviewed-content activation remain disabled.
- A subsequent production-state check confirmed the current `main` deployment is READY. Its build tail again shows the launch, regression, acceptance-flow, parent-progress, admin-operations, billing-security, learning-authority, pilot-output, and browser secret-boundary validators passing.
- Vercel's last-24-hours grouped runtime errors initially contained only five older Node `DEP0169 url.parse()` deprecation warnings from the self-pilot endpoints, last seen 2026-08-29; a fresh third-cycle check on 2026-08-30 returned no runtime errors in the selected 24-hour window.
- A later same-day production check again found the current deployment READY and no runtime errors in the selected prior-24-hour window. No launch-authority checkbox changed during the private staging-content work described below.
- Before the latest content QA cycle, Vercel again reported the current production deployment READY, the complete diagnostic/practice/learning/parent/admin/billing/launch/regression/pilot/secret-boundary validation chain passed in the build tail, and the selected prior-two-hour runtime-error query returned no runtime errors.

### Question-bank AI QA

- Connected expansion bank remains 434 original staging drafts, all `production_approved=FALSE`.
- AI-review coverage advanced from 14 to 28 of 434 items; 406 remain.
- The newly reviewed 14 right-triangle/trigonometry drafts all have mathematically correct answer keys and valid skill alignment, but all 14 were marked `revise` because their explanations contain a repeated terminal equality such as `25=25` or `3/4=3/4`.
- Four of those items were recalibrated from author-rated Hard to AI-rated Medium. Current AI-review summary after that batch was 14 PASS, 14 REVISE, 0 REJECT, 8 total difficulty changes.
- AI-review coverage then advanced from 28 to 42 of 434 items; 392 remain.
- The additional 14 `lines-angles-triangles` drafts all passed AI accuracy/alignment/key/ambiguity QA. Ten required difficulty recalibration: six author-rated Medium items were recalibrated to Easy because they are direct triangle-angle-sum tasks, and four author-rated Hard similar-triangle items were recalibrated to Medium because the scale factor is explicit and requires only one multiplication.
- The row-level AI Review ledger was written and re-read successfully. At that point the AI-review summary was 28 PASS, 14 REVISE, 0 REJECT, 18 total difficulty changes, with reviewed difficulty mix 18 Easy / 24 Medium / 0 Hard.
- AI-review coverage then advanced from 42 to 56 of 434 items; 378 remain.
- The additional 14 `area-volume` drafts all passed AI accuracy/alignment/key/ambiguity QA. Six direct rectangular-prism volume items were recalibrated from author-rated Medium to AI-rated Easy because all dimensions are given and only direct formula substitution is required. Four similar-triangle area-scaling items were recalibrated from author-rated Hard to AI-rated Medium because the linear scale factor is explicit and the solution requires two routine steps. Four foundational rectangle-area items remained Easy.
- The `AI Review` rows for all 14 area/volume items were written and re-read successfully. The `AI Review Summary` was updated to 56 reviewed / 378 remaining / 42 PASS / 14 REVISE / 0 REJECT, with 28 total difficulty changes and a reviewed difficulty mix of 28 Easy / 28 Medium / 0 Hard.
- AI-review coverage then advanced from 56 to 70 of 434 items; 364 remain.
- The additional 14 `statistical-claims` drafts all passed AI accuracy/alignment/key/ambiguity QA. Current College Board SAT Suite specifications were rechecked before review and confirm that evaluating statistical claims through observational studies and experiments is an SAT-only Problem-Solving and Data Analysis testing point; the batch's SAT-only eligibility is therefore aligned with the current framework.
- Four author-rated Hard statistical-claims items were recalibrated to Medium because their design features and confounders are stated explicitly and the distractors test direct misconceptions. The other ten retained their author difficulty. The row-level AI Review ledger was written and re-read successfully.
- The `AI Review Summary` then read 70 reviewed / 364 remaining / 56 PASS / 14 REVISE / 0 REJECT, with 32 total difficulty changes and a reviewed difficulty mix of 32 Easy / 38 Medium / 0 Hard.
- The 14 right-triangle/trigonometry explanation defects were then repaired in the private staging bank. Each material edit received a newly generated canonical SHA-256 `content_hash`, and all 14 items were re-reviewed against the repaired content. They now pass AI QA while remaining `draft_unreviewed` and `production_approved=FALSE`; the four prior Hard-to-Medium difficulty recalibrations remain advisory.
- A canonical-hash audit of all 434 staging rows found two additional stale hashes in unreviewed `boundaries` items. The hashes were regenerated against the exact current drafts without changing their approval state.
- The same audit found that 56 previously completed AI Review records had blank `content_hash` cells even though their review decisions were present. Those advisory records were repaired to bind each review to the exact current question hash. A full-workbook verification then confirmed 434/434 question hashes match the repository canonicalization rule and all 70 completed AI Review records are hash-bound and policy-consistent.
- Current College Board Reading and Writing specifications were rechecked before the next batch and still list Standard English Conventions with the `Boundaries` testing point, including punctuation choices that complete text according to Standard English conventions.
- AI QA then covered all 14 `boundaries` drafts. Pre-review ambiguity screening repaired five choice sets before they were allowed to pass: one practice item had both a period and semicolon as conventionally valid answers, while four other items contained punctuation distractors that could support a defensible alternate reading. The repaired drafts received new canonical hashes and were rechecked before the AI records were written.
- All 14 repaired/current `boundaries` drafts now pass AI accuracy, alignment, answer-key, and ambiguity review. Seven author difficulty ratings were recalibrated: five direct convention-recognition items moved to Easy and two direct independent-clause items moved from Hard to Medium.
- AI-review coverage reached 84 of 434 items; 350 remained. At that point the advisory summary was 84 PASS / 0 REVISE / 0 REJECT / 0 NEEDS HUMAN REVIEW, 39 total difficulty changes, 41 Easy / 43 Medium / 0 Hard, with 39 Medium-priority and 45 Normal-priority human-review records.
- A structural defect in the `AI Review` worksheet was then repaired: the old `ARRAYFORMULA` in the content-hash column collided with explicit immutable review-time hashes and produced a `#REF!`. The spill behavior was removed from the reviewed range while explicit hash snapshots were preserved; a full-sheet check then returned zero `#REF!` cells.
- AI QA then covered all 14 `central-ideas-details` drafts. All passed accuracy, alignment, answer-key, ambiguity, and editorial/accessibility review. Ten advisory difficulty ratings changed: six Medium-to-Easy and four Hard-to-Medium. The ledger advanced to 98 reviewed / 336 remaining / 98 PASS, with 49 total difficulty changes and a reviewed mix of 51 Easy / 47 Medium / 0 Hard.
- Current College Board Reading and Writing specifications were rechecked before the next batch and continue to list `Command of Evidence` under Information and Ideas, including the Textual testing point requiring students to determine textual evidence that best supports a specified claim or point.
- AI QA then inspected all 14 `command-evidence-textual` drafts. Their answer keys, skill/domain/exam alignment, and distractor logic were sound, but all 14 shared a generic explanation that merely repeated an evidence-selection rule and did not identify the item-specific decisive evidence/result. That violated the repository's instructional-explanation standard, especially for practice content.
- The 14 `command-evidence-textual` explanations were rewritten in the private staging bank to identify the decisive evidence, show why it supports the stated claim, state the correct result, and distinguish setup/control details from supporting evidence. Every material edit received a newly generated canonical SHA-256 `content_hash` before final AI review.
- All 14 repaired `command-evidence-textual` drafts now pass AI accuracy, alignment, answer-key, ambiguity, and editorial/accessibility review. Ten advisory difficulty ratings changed: six Medium-to-Easy and four Hard-to-Medium; the four original Easy items remained Easy.
- Post-write verification shows 112 reviewed / 322 remaining / 112 PASS / 0 REVISE / 0 REJECT / 0 NEEDS HUMAN REVIEW, 59 total difficulty changes, 59 Medium-priority and 53 Normal-priority human-review records, and a reviewed difficulty mix of 61 Easy / 51 Medium / 0 Hard.
- The exact repaired question rows were re-read with `qa_status='draft_unreviewed'` and `production_approved=FALSE`; a whole-bank scan of the 434 `production_approved` cells returned zero TRUE values, and a full `AI Review` scan returned zero `#REF!` cells.
- No AI review was represented as independent human approval. No question was imported, activated, production-approved, or externally published.

### Pilot/browser status

- The direct browser harness still covers the rendered parent login, child creation, student-login activation, student sign-in/onboarding, diagnostic, adaptive learning path, teaching material, practice, Journey progress, parent progress, and trusted database checks.
- Normal parent signup remains blocked by the Supabase email-delivery rate limiter. The harness records that checkpoint as failed rather than disguising it as a pass, then uses a reserved test-only parent solely to continue downstream QA.
- The current connected Supabase workspace still exposes only the unrelated `Marketing OS Project` and does not expose SATprep.io production project `ataaiocpbjavmdpgmzlv`; no changes were made to that unrelated project. Exact Auth/SMTP remediation therefore remains pending authorized access to the SATprep production project.
- The Vercel-side direct browser harness can launch a real rendered browser from an isolated Sandbox, but initiating it requires a fresh capability-scoped service-only pilot enrollment. This automation does not currently have authorized SATprep Supabase access to mint or inspect that capability, so no attempt was made to bypass or guess it.
- Direct browser execution from the automation host itself remains unavailable. That is a test-runner limitation, not a product failure; production deployment/build/runtime inspection continued through Vercel instead.

### Follow-up priorities

1. Continue AI review of the 322 remaining unapproved expansion-bank drafts and isolate systematic editorial/calibration defects before human review.
2. Keep running whole-workbook canonical-hash and AI-record integrity checks after every content edit/review batch so advisory reviews cannot drift from the exact drafts they describe.
3. Resolve the production Auth email-delivery rate-limit/SMTP path when the SATprep Supabase project is available through an authorized connector.
4. Run a fresh capability-scoped full browser pilot after a fresh service-only pilot enrollment can be authorized, then reconcile rendered checkpoints with parent/admin database state.
5. Keep commercial content inactive until independent human review, cross-bank duplicate screening, reviewed-version hashes, inactive import, runtime QA, and explicit activation gates are complete.

## 2026-08-30 — quantitative command-evidence cycle

### Question-bank construct repair and AI QA

- The next 14 unreviewed Reading and Writing `command-evidence-quantitative` drafts were inspected against the current Information and Ideas / Command of Evidence construct before AI review.
- A systematic construct defect was found: all 14 items were effectively bare maximum/minimum table-reading questions and did not present a stated claim or conclusion for the student to support. That was weaker than both the repository authoring standard for evidence items and the intended Command of Evidence construct.
- All 14 staging drafts were repaired before review. Each now presents an explicit claim, asks which choice most effectively uses the table data to support that claim, supplies quantitative evidence statements as answer choices, and includes an item-specific explanation that compares the decisive values and avoids unsupported causal overclaim where relevant.
- Every repaired draft received a newly generated canonical SHA-256 `content_hash`, and the exact edited rows were re-read after write. They remain `qa_status='draft_unreviewed'` and `production_approved=FALSE`.
- All 14 repaired quantitative Command of Evidence drafts then passed AI accuracy, alignment, answer-key, ambiguity, and editorial/accessibility QA. Ten author difficulty ratings were recalibrated to Easy because the repaired items still require only a direct one-step quantitative comparison; four original Easy ratings remained Easy.
- Advisory coverage is now 126 of 434 reviewed / 308 remaining / 126 PASS / 0 REVISE / 0 REJECT / 0 NEEDS HUMAN REVIEW, with 69 total difficulty changes, 69 Medium-priority and 57 Normal-priority human-review records, and a reviewed difficulty mix of 75 Easy / 51 Medium / 0 Hard.
- A separate reporting defect was found in `AI Review Summary`: except for total staged questions, the visible totals were hard-coded at the prior 112-item state and therefore did not advance when new review rows were written. The hard-coded metrics were replaced with formulas derived from the authoritative `AI Review` columns. Re-read verification now returns the live 126/308/126 totals and the corresponding difficulty/priority counts automatically.
- A whole-bank recheck of all 434 `production_approved` cells found zero TRUE values. No AI review was represented as independent human approval, and no question was imported, activated, production-approved, or externally published.

### Access and launch gates

- SATprep production Supabase access remains unavailable through the connected Supabase workspace; only the unrelated Marketing OS project is exposed, so no database/Auth/RLS changes were attempted against the wrong project.
- The production Auth email-delivery rate-limit and capability-scoped full-browser pilot remain pending authorized SATprep production access. No capability, credential, or launch gate was bypassed.
- Public indexing, public billing, live payments, first-party marketing measurement, outbound marketing, external publishing, and unreviewed-content activation remain disabled.

## 2026-08-30 — inference construct and explanation repair

### Question-bank AI QA

- The next 14 unreviewed Reading and Writing `inferences` drafts were inspected against the current College Board SAT Suite stem and skill definition before AI review. The current Student Question Bank lists Inferences under Information and Ideas and uses the stem `Which choice most logically completes the text?`.
- A systematic format/instructional defect was found across all 14 drafts: they used `Which choice most logically follows from the text?` without a completion blank, and every item shared the same generic inference explanation. The underlying passages, keys, and distractor logic were otherwise sound.
- All 14 staging drafts were repaired before final AI review. Each now presents a final completion blank, uses the current official-style completion stem, and has an item-specific teaching explanation identifying the decisive evidence and why the keyed inference is appropriately limited. Each material edit received a newly generated canonical SHA-256 `content_hash` and the exact edited rows were re-read after write.
- All 14 repaired/current Inferences drafts passed AI accuracy, alignment, answer-key, ambiguity, and editorial/accessibility QA. Nine author difficulty ratings changed: five Medium items and all four author-rated Hard items were recalibrated to Easy; the bus-route synthesis item remained Medium. This reflects actual reasoning demand rather than preserving the authored distribution.
- Advisory coverage is now 140 of 434 reviewed / 294 remaining / 140 PASS / 0 REVISE / 0 REJECT / 0 NEEDS HUMAN REVIEW, with 78 total difficulty changes, 78 Medium-priority and 62 Normal-priority human-review records, and a reviewed difficulty mix of 88 Easy / 52 Medium / 0 Hard.
- The current 140-item reviewed sample still contains zero AI-rated Hard items despite many author-rated Hard labels. This is now an explicit content-quality risk: the staging generator's nominal difficulty distribution is not producing genuinely hard reasoning often enough. Human review should not be asked to preserve the authored Hard labels; later authoring/augmentation should add genuinely complex items before commercial depth can be considered satisfied.
- A whole-bank recheck of all 434 `production_approved` cells again found zero TRUE values. No AI review was represented as independent human approval, and no question was imported, activated, production-approved, or externally published.

### Production, pilot, and access checks

- Before this staging-only content edit, the current production deployment was READY, its build tail showed the diagnostic, practice, adaptive-learning, trusted-learning, acceptance-flow, parent-progress, admin, billing, launch, regression, pilot-output, and browser secret-boundary validators passing, and the selected prior-two-hour production runtime-error query returned no errors.
- The connected Supabase workspace still exposes only the unrelated Marketing OS project, not SATprep.io production project `ataaiocpbjavmdpgmzlv`; no database, Auth, RLS, SMTP, or pilot-capability change was attempted against the wrong project.
- The production Auth email-delivery rate-limit and capability-scoped rendered-browser pilot remain pending authorized SATprep production access. No capability, credential, or launch gate was bypassed.
- Public indexing, public billing, live payments, first-party marketing measurement, outbound marketing, external publishing, and unreviewed-content activation remain disabled.

### Updated follow-up priorities

1. Continue AI review of the 294 remaining unapproved expansion-bank drafts, while flagging systematic difficulty under-calibration and replacing/augmenting nominal Hard items that do not meet the rubric.
2. Keep canonical-hash and AI-record integrity checks tied to the exact drafts after every material edit.
3. Resolve the production Auth email-delivery/SMTP path only when the SATprep Supabase project is available through an authorized connector.
4. Run a fresh capability-scoped rendered-browser pilot after a fresh service-only pilot enrollment can be authorized, then reconcile the parent/student journey with parent/admin trusted state.
5. Keep all commercial content inactive until independent human review, cross-bank duplicate screening, reviewed-version hashes, inactive import, runtime QA, and explicit activation gates are complete.
