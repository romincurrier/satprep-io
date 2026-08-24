# SATprep.io Commercial Launch Status

Last updated: 2026-08-24

## Current state
SATprep.io is a **pre-launch commercial candidate**, not yet approved for public paying customers. The product now includes student/parent/admin/billing flows, prior-assessment ingestion, an assessment-only adaptive diagnostic, learning/practice with explanations, mastery/progress tracking, proprietary content QA, SEO/trust content, date-driven marketing planning, privacy/security operating materials, durable API abuse controls, and baseline browser/accessibility hardening.

## Major foundations completed
- Current SAT/PSAT taxonomy and structure have been mapped to first-party College Board source material.
- Proprietary diagnostic/practice architecture covers every official skill point across the eight SAT domains.
- Staged practice depth has increased to **93 original items: three original practice items for every official skill point**. Only the previously reviewed base bank remains student-facing; all newer items remain staged behind independent review.
- Secure-v3 diagnostic delivery keeps answer keys/explanations server-side during baseline assessment and preserves resume state.
- Practice/learning mode gives immediate correct-answer and process explanations; the diagnostic remains assessment-only.
- Automated content checks cover IDs, answer keys, taxonomy, exam eligibility, explanations, official-skill coverage, blueprints, exact diagnostic/practice duplicates, practice/practice duplicates, and hash-pinned independent approvals.
- Content-calibration reporting is prepared for pilot data; authored difficulty remains a development label until empirically calibrated.
- PDF/spreadsheet prior-assessment ingestion architecture preserves native score types and gates unsupported extraction behind validation.
- Public SEO architecture includes SAT/PSAT pillar pages, skill clusters, study-plan/use-case pages, metadata, canonical URLs, JSON-LD, sitemap, and internal-link validation.
- Marketing asset/data/operating plans now include a separate **2026–27 date-driven campaign calendar** built around verified College Board registration, test, in-school, and score-release moments.
- Support, privacy, incident-response, content-review, calibration, commercial-launch, information-security, data-inventory, processor-register, and proposed retention/deletion materials are in the repository.
- Durable service-role API rate limiting is designed for diagnostics, youth/parent setup, account activation, and Stripe routes; pending database migration remains gated while Supabase is inactive.

## Latest hardening completed
### Prelaunch commercial and billing gate
- Removed hard-coded price/Offer data from root SoftwareApplication JSON-LD while public billing terms are not launch-approved.
- `prelaunch-guard.js` now loads before the billing module.
- On `satprep.io` and `www.satprep.io`, the guard strips billing/checkout-return query parameters, removes billing controls, blocks checkout/portal clicks, replaces any billing screen with a prelaunch message, replaces public pricing copy, and removes unverified trial/cancel claims.
- Non-public preview hosts still allow billing QA so test-mode checkout flows can be validated before an explicit live launch decision.
- `npm run validate:launch` fails production builds if prelaunch pricing metadata, script order, billing gating, youth safeguards, browser headers, or baseline accessibility safeguards regress.

### Youth-account privacy/safety guard
- The under-13 setup form is intercepted before the legacy browser database-write handler and routed through `/api/parent-setup-request`, which has origin checks, uniform responses, service-role persistence, and durable rate limiting.
- Teen signup checks the entered date of birth before account creation and blocks the teen flow if the DOB indicates the learner is under 13 or otherwise invalid.
- The legacy direct parent-setup insert remains in `marketing.js` temporarily for backward compatibility, but capture-phase interception prevents it from running in the current application shell; removing that dead/legacy path remains cleanup work.

### Browser security headers
- Added an enforcing Content Security Policy restricting resource origins, blocking object/plugin content and framing, limiting Supabase connectivity to the configured project, and allowing PDF workers only from self/blob.
- Added Cross-Origin-Opener-Policy and X-Permitted-Cross-Domain-Policies alongside HSTS, nosniff, frame denial, Referrer-Policy, and Permissions-Policy.
- Browser Payment Request API remains disabled while billing is prelaunch.

### Baseline accessibility layer
- Added a keyboard skip link and focusable application target.
- Added visible `:focus-visible` treatment, 44px baseline interactive-control targets, reduced-motion support, and higher-contrast preference handling.
- These are baseline safeguards, not a claim of WCAG conformance; full keyboard/screen-reader/manual accessibility regression remains a launch gate.

### Privacy/security operating materials
- `docs/INFORMATION_SECURITY_PROGRAM.md`: prelaunch written security-program baseline covering governance, classification, least privilege, secrets, secure development, dependencies, logging, processors, billing, backups, incident response, access control, marketing separation, accessibility, and launch evidence.
- `docs/DATA_INVENTORY.md`: repository-derived personal-data/data-flow inventory that must be reconciled against the live database after reactivation.
- `docs/PROCESSOR_REGISTER.md`: known Supabase/Vercel/Stripe/GitHub processor register plus gates for future email, analytics, support, monitoring, advertising, and AI providers.
- `docs/DATA_RETENTION_SCHEDULE.md`: proposed engineering retention/deletion targets, clearly marked as pending legal/privacy/finance approval and technical verification.
- `docs/PRIVACY_LAUNCH_CHECKLIST.md` has been updated for the amended COPPA framework/current FTC compliance guidance, including written security-program, retention, processor-safeguard, parent-control, and privacy-notice requirements.

## Infrastructure status
- Supabase project `nrjqykfrnfrgyuvprwob` was rechecked and remains `INACTIVE`.
- It was **not restored automatically** because restoration can change hosted infrastructure/billing state.
- Content-system/provenance, calibration, marketing-measurement, privacy-request, and API-rate-limit migrations are committed but are **not claimed live**.
- The Vercel build containing the 93-item staged practice bank, stricter duplicate validation, public billing gate, launch validator, CSP/browser headers, and baseline accessibility layer is green.

## Content rules still in force
- No question becomes commercially approved merely because automated validation passes.
- The 62 newer staged practice questions remain non-student-facing until independent accuracy, SAT/PSAT alignment, editorial, originality, and accessibility/bias review is completed and hash-valid approvals are applied.
- Current staged depth is 3 practice items per skill; the internal launch-readiness target remains 8 practice items and 6 diagnostic items per skill with minimum human-approved depth before broad commercial use.
- Diagnostic mastery values are learning signals, not official SAT/PSAT scaled-score predictions.
- No score-gain, admissions, scholarship, superiority, or guaranteed-outcome claims may be published without evidence.

## Explicitly not activated
- No Supabase restore or unapplied migration activation.
- No live Stripe activation, public purchase path, or approved public pricing/trial terms.
- No paid media, ad spend, prospect email, affiliate/referral launch, social publishing, Search Console submission, or outbound campaign launch.
- No behavioral-advertising or learner-performance marketing audiences.
- No final legal/privacy policy publication.
- No identifiable student outcomes/reports used as marketing proof.

## Highest-priority next actions
1. When Supabase is intentionally active, reconcile/apply pending migrations and run secure-v3 + RLS + rate-limit end-to-end tests.
2. Independently review/approve production question content and continue increasing rotation toward the 8-practice/6-diagnostic per-skill launch-depth target.
3. Remove the legacy direct under-13 database insert from `marketing.js` after refactoring the signup flow to use the protected API natively.
4. Complete full regression across student, parent, admin, onboarding, billing previews, uploads, learning, mastery, journey/progress, privacy requests, and support recovery.
5. Perform manual accessibility regression with keyboard-only navigation, screen reader, zoom/reflow, contrast, focus order, error announcements, and mobile touch targets.
6. Verify CSP/header behavior on the deployed production host and add platform-layer firewall/bot controls without treating them as substitutes for route authorization.
7. Reconcile the data inventory, processor register, retention schedule, final legal/privacy notices, live billing terms, analytics consent/attribution, lifecycle email, and campaign activation before public launch.

## Commercial launch gates still open
- Active verified production database with migrations applied.
- Independent content review plus sufficient depth/rotation.
- Pilot calibration process after adequate data exists.
- Full end-to-end regression and production smoke testing.
- Minor-data/privacy/legal/data-retention and processor review.
- Manual accessibility review.
- Final RLS/API authorization and platform-layer firewall review.
- Live billing verification and approved pricing/trial terms.
- Approved analytics/attribution and outbound marketing activation.
