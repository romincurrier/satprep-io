# SATprep.io Autonomous Build Status

Last updated: 2026-08-24

## Current commercial-candidate state
SATprep.io is a **pre-launch commercial candidate**, not yet approved for public paying customers. The architecture now includes student/parent/admin/billing flows, prior-assessment ingestion, an assessment-only adaptive diagnostic, learning/practice with explanations, mastery/progress tracking, proprietary content QA, SEO/trust pages, pre-launch marketing/measurement planning, and a durable application-layer abuse-control design.

## Major foundations completed
- Reverified the current College Board Digital SAT Suite taxonomy and structure against first-party sources.
- Added `sat-spec.js` with Reading & Writing and Math domains, official skill points, SAT/PSAT eligibility differences, section structure, and distributions.
- Added an original proprietary diagnostic bank and deterministic evidence-aware diagnostic blueprint covering all eight major domains.
- Added secure-v3 diagnostic delivery/scoring endpoints so the browser receives prompts/choices but not answer keys or explanations during the baseline assessment.
- Existing legacy diagnostic attempts remain resumable on their saved plan; new secure attempts are assessment-only.
- Added original learning/practice architecture with immediate correct-answer and process explanations after practice responses.
- Expanded the staged practice pool to 62 original items, at least two authored items per official skill point; the additional 31 remain behind the independent-review gate.
- Added automated content validation for IDs, answer keys, taxonomy, exam eligibility, explanations, official-skill coverage, blueprints, and exact diagnostic/practice duplicates.
- Added hash-pinned independent content review workflow: export, reviewer decisions, validation, approval registry, and build-time approval verification.
- Added server-only content calibration views/reporting design for pilot QA once adequate response data exists.
- Added content-review, commercial-launch, privacy, support, incident-response, marketing, SEO, calibration, and API-abuse-control governance documentation.
- Added prior-assessment PDF/spreadsheet ingestion with native score-type preservation and a generic validation gate for unsupported reports.
- Added SEO/trust architecture with canonical metadata, structured data, internal-link validation, sitemap validation, SAT/PSAT content clusters, and current-source governance.
- Added privacy-minimized marketing measurement and privacy-request migrations, both still gated from live use pending database/privacy review.

## Progress in the latest build run
### Durable API abuse controls
- Added pending `migrations/20260824_api_rate_limits.sql` with a service-role-only fixed-window limiter designed to work across parallel/cold Vercel serverless instances.
- Rate-limit subjects are SHA-256 hashed before persistence; raw user IDs/emails are not stored in the counter table.
- Browser roles are explicitly denied table access and RPC execution; only `service_role` may consume counters.
- Protected routes fail with HTTP 429 plus `Retry-After` when a limit is exceeded.
- If the durable limiter is unavailable, protected privileged routes fail closed with HTTP 503 rather than silently bypassing the control.
- Added route-specific limits for secure diagnostic session/item/answer APIs, student-login activation, parent invitation reads/acceptance, under-13 parent setup requests, Stripe checkout creation/confirmation, and billing portal creation.
- Extended `npm run validate:security` so a future change cannot remove these abuse controls, service-only grants, hashed subjects, fail-closed behavior, or `Retry-After` handling without failing the production build.
- Added `docs/API_ABUSE_CONTROLS.md` with operating limits, privacy boundaries, monitoring/tuning rules, and pre-launch verification steps.
- A Vercel build containing the new validator and protected endpoint changes has been confirmed green.

### Existing secure diagnostic integrity remains enforced
- Secure diagnostic responses are explicitly linked to `content_item_id` and marked `scored_by_server=true`.
- Secure progress/finalization counts only server-scored rows and verifies server-authored item identity.
- New secure attempts verify required content-system migration readiness and fail closed when the data layer is not ready.
- The browser does not receive answer keys or explanations during the diagnostic.

## Current infrastructure finding
- Supabase project `nrjqykfrnfrgyuvprwob` was rechecked during this run and still reports `INACTIVE`.
- The project was not restored automatically because restoring hosted infrastructure can change billing/operational state and is an explicit approval gate.
- Content-system, calibration, marketing-measurement, privacy-request, and API-rate-limit migrations are therefore committed but **not claimed as live**.

## Content readiness rules still in force
- No staged question is commercially approved merely because automated validation passes.
- The 31-item practice expansion remains non-student-facing until independent accuracy, alignment, editorial, originality, and accessibility/bias review is completed and hash-valid approvals are applied.
- Authored difficulty labels are development expectations, not empirical SAT difficulty claims.
- Diagnostic mastery values are learning signals, not official SAT/PSAT scaled-score predictions.
- No score-gain, admission, scholarship, or superiority claims may be published without supporting validation.

## Explicitly not activated
- No Supabase restore, live Stripe payments, or public pricing activation.
- No paid media, ad spend, prospect email, affiliate/referral activation, social publishing, Search Console submission, or public campaign launch.
- No behavioral advertising or learner-performance marketing audiences.
- No final legal/privacy policy publication.
- No use of real student reports, identifiable dashboards, or student outcomes in marketing assets.

## Highest-priority next actions
1. Once Supabase is intentionally active, reconcile and apply pending migrations in dependency order: content-system/provenance, API rate limits, calibration, privacy requests, and marketing measurement as approved.
2. Run end-to-end secure-v3 testing with a fresh test student: start, save, refresh, new window/device resume, completion, finalization, learning-path update, and controlled 429/503 abuse-control tests.
3. Verify secure rows are `content_item_id` linked and `scored_by_server=true`, verify rate-limit table/RPC browser denial, then run Supabase security/performance advisors.
4. Obtain independent human content review and apply only hash-valid approvals.
5. Continue expanding question depth/rotation across difficulty levels, contexts, answer formats, and distractor patterns.
6. Add/verify platform-layer Vercel firewall/traffic protections as an additional launch layer; do not treat them as a substitute for route authorization and durable application limits.
7. Complete regression testing across student, parent, admin, onboarding, billing, uploads, learning, mastery, progress, privacy requests, and support recovery paths.
8. Continue SEO/use-case/parent content and synthetic marketing assets while all outbound/paid activation remains gated.

## Commercial launch gates still open
- Active, verified production database with migrations applied.
- Independent content review and sufficient question-bank depth/rotation.
- Empirical/psychometric calibration process after adequate pilot data exists.
- Full end-to-end regression and production smoke testing.
- Minor-data/privacy/legal and data-retention review.
- Final RLS/API authorization plus platform-layer firewall review.
- Live billing verification and approved public pricing.
- Approved analytics/attribution, lifecycle email, paid/organic campaign activation, and support monitoring.
