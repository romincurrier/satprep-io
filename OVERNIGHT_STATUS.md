# SATprep.io Commercial Launch Status

Last updated: 2026-08-24

## Current state
SATprep.io is a **pre-launch commercial candidate**, not approved for public paying customers. The codebase now includes student/parent/admin/onboarding/billing flows, prior-assessment ingestion, an assessment-only adaptive diagnostic, server-oriented guided practice with explanations, mastery/progress tracking, content review and calibration tooling, SEO/trust content, marketing/measurement plans, privacy/security controls, youth-account safeguards, accessibility checks, durable API rate limiting, and launch runbooks.

The latest main-branch Vercel commit check is **green** after the new commercial-launch gates and marketing-claims validator were added.

## Most recent launch hardening

### Explicit commercial launch gates
- Added `launch-gates.json` as the repository-level source of truth for launch-sensitive state.
- Public indexing, public billing, live payments, and outbound marketing remain explicitly disabled.
- The production launch validator now fails closed if those controls are changed while the College Board trademark/naming review remains unresolved.
- The global Vercel `X-Robots-Tag: noindex, nofollow, noarchive` remains in place, so the prepared SEO pages are not being intentionally opened to public search indexing.

### College Board trademark/naming gate
- Current College Board trademark guidance was reviewed on 2026-08-24 and documented in `docs/TRADEMARK_LAUNCH_GATE.md`.
- The current product name/domain contains `SAT`, which College Board identifies as a registered mark. College Board's published guidance creates a material unresolved launch issue for third-party company/product/domain/advertising use of its marks.
- This is recorded as a **launch gate, not a legal conclusion**. Before indexing, advertising, affiliate promotion, broad social/PR execution, or public billing, the intended naming/domain/mark use must be addressed through appropriate permission/legal review or a rebrand/domain transition.
- The content boundary is also explicit: do not copy/reproduce official College Board test questions in the commercial bank, and do not use College Board copyrighted test content to train a generative authoring system.

### Marketing-claims build gate
- Added `validate:marketing-claims` to every production build.
- Explicit affiliation/ownership representations such as College Board/SAT/PSAT “approved,” “authorized,” “certified,” or “official SATprep” are hard build failures.
- Potential score guarantees/outcome language is surfaced for prelaunch copy review.
- `docs/MARKETING_OPERATING_PLAN.md` now includes a Phase 0 naming/trademark decision before SEO submission, ad accounts, campaigns, affiliates, social-page creation, PR, or broad public marketing.

### Build/deployment observability restored
- The current main branch now reports a successful Vercel commit check.
- The independent GitHub Actions validation workflow is also committed as a second build-validation path.
- Direct Vercel project-log access through the connected Vercel scope is still unavailable, so GitHub commit status remains the presently available deployment signal.

## Product and content state
- Official SAT/PSAT taxonomy and structure are mapped to current College Board public specifications.
- The committed staged practice inventory contains **93 original items (3 per official skill point)** for development/review; newer items remain withheld behind independent review.
- Secure commercial content is designed to require active `production_approved` status plus current exact-hash approvals for accuracy, SAT/PSAT alignment, editorial quality, bias/accessibility, and originality.
- Current questions whose answer keys have existed in public Git history are **not** suitable as the secure commercial diagnostic bank.
- Commercial depth target remains at least **8 practice items and 6 diagnostic items per official skill**, with multiple difficulty levels, independent review, and later pilot calibration.
- Diagnostic behavior remains assessment-only: no right/wrong teaching during the baseline assessment.
- Commercial practice is designed to give right/wrong feedback, the correct answer, and instructional explanations, with server-side scoring and durable resume.

## Security, privacy, accessibility, and billing state
- Public checkout and checkout confirmation are server-gated and disabled on the public host unless explicit launch flags are enabled.
- Live Stripe use has a separate server-side lock; public test billing is not treated as production billing.
- Youth signup includes browser defense-in-depth plus a pending database age-gate migration; under-13 learners are routed through the parent/guardian workflow.
- Durable API abuse controls, privacy-request workflow, profile-privilege restrictions, content-integrity controls, and commercial-practice session protections are implemented in code/migrations.
- Production builds validate security, practice security, adaptive practice, youth privacy, privilege boundaries, private content workflow, SEO, marketing claims, accessibility, launch state, and deterministic regression behavior.
- Automated accessibility checks are in place, but manual keyboard/screen-reader/zoom/contrast/device testing remains a launch requirement.

## Infrastructure state
- Supabase project `nrjqykfrnfrgyuvprwob` remains **INACTIVE** and was not restored automatically because restoration can affect hosted infrastructure/billing.
- Pending migrations include the content/review system, practice sessions, calibration, marketing measurement, privacy requests, durable API rate limits, profile privilege locking, and student-signup age gate. They are committed but **not claimed live**.
- GitHub repository is currently public. Fresh secure commercial question content should use the documented external private-review/import bridge and should ultimately live behind a dedicated private editorial/content boundary.
- Public indexing, live Stripe, ads, public outbound email, affiliate/referral execution, Search Console submission, retargeting, social publishing, and final legal/privacy publication remain disabled.

## Highest-priority next actions
1. Resolve the **brand/domain/trademark launch gate** through documented permission/legal review or a rebrand/domain transition before indexing or outbound marketing.
2. Intentionally reactivate Supabase when approved; apply/reconcile pending migrations and test RLS, service-role, auth-trigger, rate-limit, privacy, content, diagnostic, and practice boundaries end to end.
3. Establish a dedicated private proprietary-content repository/editorial system and import fresh independently reviewed diagnostic/practice content with exact hash approvals.
4. Increase approved content depth/rotation/difficulty distribution toward the commercial targets.
5. End-to-end test secure diagnostic and commercial practice: resume, adaptive bands, revoked approvals, right/wrong practice feedback, idempotency, atomic mastery updates, 429/503 behavior, and cross-account isolation.
6. Test direct teen signup versus parent-authorized under-13 activation after the age-gate migration is live.
7. Remove/decommission browser-writable mastery/question-attempt authority from the commercial path after server practice is proven live.
8. Complete full functional regression across student, parent, admin, onboarding, billing preview, prior uploads, progress/journey, privacy requests, and support recovery.
9. Complete manual accessibility and privacy/legal/data-retention/processor reviews.
10. Only after explicit approval and all applicable gates: enable public indexing/billing/analytics and begin outbound marketing execution.

## Launch gates still open
- College Board trademark/naming/domain resolution.
- Active verified production database with pending migrations applied.
- Dedicated private proprietary-content boundary and fresh secure diagnostic bank.
- Independent review plus sufficient content depth/rotation/difficulty distribution.
- Commercial diagnostic/practice end-to-end verification and legacy browser-authority retirement.
- Youth-account/parental-consent end-to-end verification and final legal/privacy approval.
- Manual accessibility regression.
- Pilot calibration after adequate usage data.
- Full functional/security/privacy regression.
- Final legal/privacy/data-retention/processor review.
- Live billing/pricing/trial approval.
- Approved analytics/attribution and outbound marketing activation.
