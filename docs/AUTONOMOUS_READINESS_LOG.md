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

### Question-bank AI QA

- Connected expansion bank remains 434 original staging drafts, all `production_approved=FALSE`.
- AI-review coverage advanced from 14 to 28 of 434 items; 406 remain.
- The newly reviewed 14 right-triangle/trigonometry drafts all have mathematically correct answer keys and valid skill alignment, but all 14 were marked `revise` because their explanations contain a repeated terminal equality such as `25=25` or `3/4=3/4`.
- Four of those items were recalibrated from author-rated Hard to AI-rated Medium. Current AI-review summary: 14 PASS, 14 REVISE, 0 REJECT, 8 total difficulty changes.
- No AI review was represented as independent human approval. No question was imported, activated, production-approved, or externally published.

### Pilot/browser status

- The direct browser harness still covers the rendered parent login, child creation, student-login activation, student sign-in/onboarding, diagnostic, adaptive learning path, teaching material, practice, Journey progress, parent progress, and trusted database checks.
- Normal parent signup remains blocked by the Supabase email-delivery rate limiter. The harness records that checkpoint as failed rather than disguising it as a pass, then uses a reserved test-only parent solely to continue downstream QA.
- The current connected Supabase workspace does not expose SATprep.io production project `ataaiocpbjavmdpgmzlv`; no changes were made to the unrelated connected Supabase project. Exact Auth/SMTP remediation therefore remains pending access to the SATprep production project.

### Follow-up priorities

1. Continue AI review of the 406 remaining unapproved expansion-bank drafts and isolate systematic editorial/calibration defects before human review.
2. Resolve the production Auth email-delivery rate-limit/SMTP path when the SATprep Supabase project is available through an authorized connector.
3. Run a fresh capability-scoped full browser pilot after the signup infrastructure blocker is resolved, then reconcile rendered checkpoints with parent/admin database state.
4. Keep commercial content inactive until independent human review, cross-bank duplicate screening, reviewed-version hashes, inactive import, runtime QA, and explicit activation gates are complete.
