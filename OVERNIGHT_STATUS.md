# SATprep.io Commercial Launch Status

Last updated: 2026-08-24

## Current state
SATprep.io is a **pre-launch commercial candidate**, not yet approved for public paying customers. The product now includes student/parent/admin/billing flows, prior-assessment ingestion, an assessment-only adaptive diagnostic, learning/practice with explanations, mastery/progress tracking, proprietary content QA, SEO/trust content, marketing planning/measurement architecture, durable API abuse controls, and baseline browser/accessibility hardening.

## Major foundations completed
- Current SAT/PSAT taxonomy and structure have been mapped to first-party College Board source material.
- Proprietary diagnostic and practice architecture covers all eight major SAT domains; staged practice depth is 62 original items, with the second 31-item tranche remaining behind independent review.
- Secure-v3 diagnostic delivery keeps answer keys/explanations server-side during baseline assessment and preserves resume state.
- Practice/learning mode gives immediate correct-answer and process explanations.
- Automated content checks cover IDs, answer keys, taxonomy, exam eligibility, explanations, official-skill coverage, blueprints, exact duplicates, and hash-pinned independent approvals.
- Content-calibration reporting is prepared for pilot data; authored difficulty remains a development label until empirically calibrated.
- PDF/spreadsheet prior-assessment ingestion preserves native score types and gates unsupported extraction behind validation.
- Public SEO architecture includes SAT/PSAT pillar pages, skill clusters, study-plan/use-case pages, metadata, canonical URLs, JSON-LD, sitemap, and internal-link validation.
- Marketing asset, data, operating, support, privacy, incident-response, content-review, calibration, and commercial-launch runbooks are in the repository.
- Durable service-role API rate limiting is designed for diagnostics, youth/parent setup, account activation, and Stripe routes; pending database migration remains gated while Supabase is inactive.

## Latest hardening completed
### Prelaunch commercial claim gate
- Removed hard-coded price/Offer data from root SoftwareApplication JSON-LD while public billing terms are not launch-approved.
- Added `prelaunch-guard.js`, which replaces the public pricing block with a prelaunch status message and removes unverified free-trial/cancel-anytime claims until an explicit launch flag is changed.
- Added `npm run validate:launch` to fail production builds if prelaunch pricing metadata, commercial gating, youth safeguards, browser headers, or baseline accessibility safeguards regress.

### Youth-account privacy/safety guard
- The under-13 setup form is now intercepted before the legacy browser database-write handler and routed through `/api/parent-setup-request`, which has origin checks, uniform responses, service-role persistence, and durable rate limiting.
- Teen signup now checks the entered date of birth before account creation and blocks the teen flow if the DOB indicates the learner is under 13 or otherwise invalid.
- The legacy direct parent-setup insert remains in `marketing.js` temporarily for backward compatibility, but capture-phase interception prevents it from running in the current application shell; removing that legacy code remains cleanup work.

### Browser security headers
- Added an enforcing Content Security Policy restricting resource origins, blocking object/plugin content and framing, limiting Supabase connectivity to the configured project, and allowing PDF workers only from self/blob.
- Added Cross-Origin-Opener-Policy and X-Permitted-Cross-Domain-Policies alongside existing HSTS, nosniff, frame denial, Referrer-Policy, and Permissions-Policy.
- Browser Payment Request API remains disabled while billing is prelaunch.

### Baseline accessibility layer
- Added a keyboard skip link and focusable application target.
- Added visible `:focus-visible` treatment, 44px baseline interactive-control targets, reduced-motion support, and higher-contrast preference handling.
- These are baseline safeguards, not a claim of WCAG conformance; full keyboard/screen-reader/manual accessibility regression remains a launch gate.

## Infrastructure status
- Supabase project `nrjqykfrnfrgyuvprwob` was rechecked and remains `INACTIVE`.
- It was **not restored automatically** because restoration can change hosted infrastructure/billing state.
- Content-system/provenance, calibration, marketing-measurement, privacy-request, and API-rate-limit migrations are committed but are **not claimed live**.
- Vercel builds containing the prelaunch validation changes have been green; latest security/accessibility header build should be verified after deployment completion before public-launch sign-off.

## Content rules still in force
- No question becomes commercially approved merely because automated validation passes.
- Staged expansion content remains non-student-facing until independent accuracy, SAT/PSAT alignment, editorial, originality, and accessibility/bias review is completed and hash-valid approvals are applied.
- Diagnostic mastery values are learning signals, not official SAT/PSAT scaled-score predictions.
- No score-gain, admissions, scholarship, superiority, or guaranteed-outcome claims may be published without evidence.

## Explicitly not activated
- No Supabase restore or unapplied migration activation.
- No live Stripe activation or approved public pricing/trial terms.
- No paid media, ad spend, prospect email, affiliate/referral launch, social publishing, Search Console submission, or outbound campaign launch.
- No behavioral-advertising or learner-performance marketing audiences.
- No final legal/privacy policy publication.
- No identifiable student outcomes/reports used as marketing proof.

## Highest-priority next actions
1. When Supabase is intentionally active, reconcile/apply pending migrations and run secure-v3 + RLS + rate-limit end-to-end tests.
2. Independently review/approve production question content and continue increasing rotation across difficulty, context, answer format, and distractor patterns.
3. Remove the legacy direct under-13 database insert from `marketing.js` after refactoring the signup flow to use the protected API natively.
4. Complete full regression across student, parent, admin, onboarding, billing, uploads, learning, mastery, journey/progress, privacy requests, and support recovery.
5. Perform manual accessibility regression with keyboard-only navigation, screen reader, zoom/reflow, contrast, focus order, error announcements, and mobile touch targets.
6. Verify CSP/header behavior on the deployed production host and add platform-layer firewall/bot controls without treating them as substitutes for route authorization.
7. Finalize legal/privacy/data-retention review, live billing terms, analytics consent/attribution, lifecycle email, and campaign activation before public launch.

## Commercial launch gates still open
- Active verified production database with migrations applied.
- Independent content review plus sufficient depth/rotation.
- Pilot calibration process after adequate data exists.
- Full end-to-end regression and production smoke testing.
- Minor-data/privacy/legal/data-retention review.
- Manual accessibility review.
- Final RLS/API authorization and platform-layer firewall review.
- Live billing verification and approved pricing/trial terms.
- Approved analytics/attribution and outbound marketing activation.
