# SATprep.io Autonomous Build Status

Last updated: 2026-08-24

## Current commercial-candidate state
SATprep.io is a **pre-launch commercial candidate**, not yet approved for public paying customers. The architecture now includes student/parent/admin/billing flows, prior-assessment ingestion, an assessment-only adaptive diagnostic, learning/practice with explanations, mastery/progress tracking, proprietary content QA, SEO/trust pages, and pre-launch marketing/measurement planning.

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
- Added content-review, commercial-launch, privacy, support, incident-response, marketing, and SEO governance documentation.
- Added prior-assessment PDF/spreadsheet ingestion with native score-type preservation and a generic validation gate for unsupported reports.
- Added SEO/trust architecture with canonical metadata, structured data, internal-link validation, sitemap validation, and current-source governance.
- Added privacy-minimized marketing measurement and privacy-request migrations, both still gated from live use pending database/privacy review.

## Progress in the latest build run
### Secure diagnostic integrity
- Secure diagnostic responses are now explicitly written with `content_item_id` and `scored_by_server=true`.
- Secure progress and finalization now count only server-scored rows.
- Finalization verifies that `content_item_id` matches the server-authored question ID before a row contributes to the diagnostic result.
- New secure attempts now check that the content-system migration is actually present before creation/scoring. If the database is restored before required migrations are applied, the system fails closed instead of creating partially compatible secure attempts.
- Build-time security validation now requires the migration-readiness check, response provenance fields, server-scored filtering, item-identity check, and restrictive secure-v3 RLS policy.
- A Vercel build containing these security/integrity changes has been confirmed green.

### Content calibration foundation
- Added pending `20260824_content_calibration.sql` with server-only aggregate item and skill calibration views.
- Aggregate metrics include response count, facility, mean/median response time, section-score correlation, option-selection counts, and observation dates without student identifiers.
- Added `npm run content:calibration` for a server-only operational QA report.
- Added `docs/CONTENT_CALIBRATION_RUNBOOK.md` defining screening thresholds, review workflow, psychometric guardrails, privacy limits, and a clear rule that operational statistics do not replace independent review or justify SAT-score predictions.

### PSAT organic-search/content cluster
- Added dedicated pages for:
  - `/psat-score-guide/`
  - `/psat-math-prep/`
  - `/psat-reading-writing-prep/`
  - `/psat-study-plan/`
- Linked the PSAT pillar page to the new cluster and added the pages to the sitemap.
- Reverified current PSAT/NMSQT/PSAT 10 structure and score facts against College Board first-party sources and expanded `docs/SEO_SOURCE_NOTES.md` accordingly.
- Public copy preserves exam-specific skill eligibility rather than treating every SAT Math skill as a PSAT requirement.

### Conversion/trust content
- Added `/practice-explanations/`, a public, clearly labeled illustrative demo showing the intended learning-mode feedback: correct answer, reasoning steps, and reusable process.
- The demo explicitly distinguishes learning/practice from the assessment-only diagnostic and uses SATprep.io-created examples rather than official College Board questions.
- Linked the methodology page to the demo and added it to the sitemap.

## Current infrastructure finding
- Supabase project `nrjqykfrnfrgyuvprwob` still reports `INACTIVE` as of this run.
- The project was not restored automatically because restoring hosted infrastructure can change billing/operational state and is an explicit approval gate.
- Content-system, calibration, marketing-measurement, and privacy-request migrations are therefore committed but not claimed as live.

## Content readiness rules still in force
- No staged question is considered commercially approved merely because automated validation passes.
- The 31-item practice expansion remains non-student-facing until independent accuracy, alignment, editorial, originality, and accessibility/bias review is completed and hash-valid approvals are applied.
- Authored difficulty labels are development expectations, not empirical SAT difficulty claims.
- Diagnostic mastery values are learning signals, not official SAT/PSAT scaled-score predictions.
- No score-gain, admission, scholarship, or superiority claims may be published without supporting validation.

## Explicitly not activated
- No live Stripe payments or public pricing activation.
- No paid media, ad spend, prospect email, affiliate/referral activation, social publishing, Search Console submission, or public campaign launch.
- No behavioral advertising or learner-performance marketing audiences.
- No final legal/privacy policy publication.
- No use of real student reports, identifiable dashboards, or student outcomes in marketing assets.

## Highest-priority next actions
1. Once Supabase is intentionally active, reconcile and apply pending migrations in order, including content-system and secure response provenance before allowing new secure-v3 diagnostics.
2. Run end-to-end secure-v3 testing with a fresh test student: start, save, refresh, new window/device resume, completion, finalization, and learning-path update.
3. Verify secure rows are `content_item_id` linked and `scored_by_server=true`, then run calibration views and Supabase security/performance advisors.
4. Obtain independent human content review and apply only hash-valid approvals.
5. Continue expanding question depth/rotation across difficulty levels, contexts, answer formats, and distractor patterns.
6. Add and verify a durable production rate-limit/abuse-control strategy for privileged APIs and proprietary question delivery.
7. Complete regression testing across student, parent, admin, onboarding, billing, uploads, learning, mastery, progress, privacy requests, and support recovery paths.
8. Continue parent/PSAT/learning-demo SEO clusters and synthetic marketing assets while all outbound/paid activation remains gated.

## Commercial launch gates still open
- Active, verified production database with migrations applied.
- Independent content review and sufficient question-bank depth/rotation.
- Empirical/psychometric calibration process after adequate pilot data exists.
- Full end-to-end regression and production smoke testing.
- Minor-data/privacy/legal and data-retention review.
- Final RLS/API authorization/rate-limit review.
- Live billing verification and approved public pricing.
- Approved analytics/attribution, lifecycle email, paid/organic campaign activation, and support monitoring.
