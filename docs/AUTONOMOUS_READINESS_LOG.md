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
- The `AI Review Summary` now reads 70 reviewed / 364 remaining / 56 PASS / 14 REVISE / 0 REJECT, with 32 total difficulty changes and a reviewed difficulty mix of 32 Easy / 38 Medium / 0 Hard.
- No AI review was represented as independent human approval. No question was imported, activated, production-approved, or externally published.

### Pilot/browser status

- The direct browser harness still covers the rendered parent login, child creation, student-login activation, student sign-in/onboarding, diagnostic, adaptive learning path, teaching material, practice, Journey progress, parent progress, and trusted database checks.
- Normal parent signup remains blocked by the Supabase email-delivery rate limiter. The harness records that checkpoint as failed rather than disguising it as a pass, then uses a reserved test-only parent solely to continue downstream QA.
- The current connected Supabase workspace still exposes only the unrelated `Marketing OS Project` and does not expose SATprep.io production project `ataaiocpbjavmdpgmzlv`; no changes were made to that unrelated project. Exact Auth/SMTP remediation therefore remains pending authorized access to the SATprep production project.
- The Vercel-side direct browser harness can launch a real rendered browser from an isolated Sandbox, but initiating it requires a fresh capability-scoped service-only pilot enrollment. This automation does not currently have authorized SATprep Supabase access to mint or inspect that capability, so no attempt was made to bypass or guess it.
- Direct browser execution from the automation host itself remains unavailable. That is a test-runner limitation, not a product failure; production deployment/build/runtime inspection continued through Vercel instead.

### Follow-up priorities

1. Continue AI review of the 364 remaining unapproved expansion-bank drafts and isolate systematic editorial/calibration defects before human review.
2. Repair the 14 right-triangle/trigonometry explanation defects in staging with new content hashes, then re-run AI QA; keep them unapproved pending independent review.
3. Resolve the production Auth email-delivery rate-limit/SMTP path when the SATprep Supabase project is available through an authorized connector.
4. Run a fresh capability-scoped full browser pilot after a fresh service-only pilot enrollment can be authorized, then reconcile rendered checkpoints with parent/admin database state.
5. Keep commercial content inactive until independent human review, cross-bank duplicate screening, reviewed-version hashes, inactive import, runtime QA, and explicit activation gates are complete.