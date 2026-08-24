# SATprep.io Commercial Launch Status

Last updated: 2026-08-24

## Current state
SATprep.io is a **pre-launch commercial candidate**, not yet approved for public paying customers. The product now includes student/parent/admin/billing flows, prior-assessment ingestion, an assessment-only adaptive diagnostic, learning/practice with explanations, mastery/progress tracking, proprietary content QA, SEO/trust content, date-driven marketing planning, privacy/security operating materials, durable API abuse controls, and baseline browser/accessibility hardening.

## Major foundations completed
- Current SAT/PSAT taxonomy and structure have been mapped to first-party College Board source material.
- Proprietary diagnostic/practice authoring architecture covers every official skill point across the eight SAT domains.
- Staged practice depth has increased to **93 original items: three original practice items for every official skill point**. Newer items remain staged behind independent review.
- Secure-v3 diagnostic delivery is now architected to source commercial assessment prompts and scoring keys from the server-only content database rather than the committed JavaScript development bank.
- Secure-v3 selection fails closed unless an item is active `production_approved`, has a server-only answer key, and has current approving review decisions for accuracy, SAT/PSAT alignment, editorial quality, and bias/accessibility.
- The complete secure diagnostic plan is persisted server-side and verified before each item is delivered/scored; browser roles are denied direct access to proprietary content, answer keys, review records, and complete attempt plans.
- Practice/learning mode gives immediate correct-answer and process explanations; the diagnostic remains assessment-only.
- Automated content checks cover IDs, answer keys, taxonomy, exam eligibility, explanations, official-skill coverage, blueprints, exact diagnostic/practice duplicates, practice/practice duplicates, and hash-pinned independent approvals.
- Content-calibration reporting is prepared for pilot data; authored difficulty remains a development label until empirically calibrated.
- PDF/spreadsheet prior-assessment ingestion architecture preserves native score types and gates unsupported extraction behind validation.
- Public-launch SEO content is prepared in the repository, including SAT/PSAT pillars, skill clusters, score guides, study planning, current 2026–27 SAT test-date planning, metadata, canonical URLs, JSON-LD, sitemap, and internal-link validation.
- Marketing asset/data/operating plans include a separate **2026–27 date-driven campaign calendar** built around verified College Board registration, test, in-school, and score-release moments.
- Support, privacy, incident-response, content-review, calibration, commercial-launch, information-security, data-inventory, processor-register, and proposed retention/deletion materials are in the repository.
- Durable service-role API rate limiting is designed for diagnostics, youth/parent setup, account activation, and Stripe routes; pending database migration remains gated while Supabase is inactive.

## Latest hardening completed
### Production diagnostic content isolation
- Removed the obsolete `diagnostic-feedback.js` client artifact that still contained development diagnostic answer keys even though it was no longer loaded.
- Build validation now fails if that answer-key artifact reappears.
- Secure-v3 no longer imports the committed JavaScript question bank for commercial runtime scoring.
- New secure attempts are built only from server-side content marked active + `production_approved` and containing an answer key plus the four required current review approvals.
- Review history is evaluated by latest decision for each required review type, so an old approval cannot override a later revise/reject decision.
- Secure scoring retrieves the key from `content_answer_keys`; the client receives only the current safe question projection.
- `diagnostic_attempt_items` is server-only and is verified against the server-authored attempt plan before question delivery/scoring.
- If reviewed production content is not deep enough to satisfy the complete 20-question blueprint, the secure diagnostic fails closed instead of silently using internal-review questions.

### Repository exposure gate
- The connected GitHub repository was verified as **public** on 2026-08-24.
- Because development diagnostic source and answer keys have existed in public Git history, those historical items are considered compromised for secure commercial diagnostic use.
- `docs/REPOSITORY_EXPOSURE.md` records the required owner action: establish a private repository/content boundary, then use fresh diagnostic items created/imported after that boundary for commercial assessment.
- Current committed diagnostic questions remain useful for internal taxonomy/UI/blueprint QA but are not a trustworthy secure commercial bank.

### Prelaunch search-indexing gate
- SEO pages and sitemap remain fully prepared, but Vercel now sends `X-Robots-Tag: noindex, nofollow, noarchive` across the prelaunch deployment.
- The launch validator requires that header, preventing an accidental build from becoming search-indexable before explicit public-launch approval.
- The indexing gate can be deliberately removed when legal/privacy/content/billing launch checks and public marketing approval are complete.

### Prelaunch commercial and billing gate
- Removed hard-coded price/Offer data from root SoftwareApplication JSON-LD while public billing terms are not launch-approved.
- `prelaunch-guard.js` loads before the billing module.
- On `satprep.io` and `www.satprep.io`, the guard strips billing/checkout-return query parameters, removes billing controls, blocks checkout/portal clicks, replaces any billing screen with a prelaunch message, replaces public pricing copy, and removes unverified trial/cancel claims.
- Non-public preview hosts still allow billing QA so test-mode checkout flows can be validated before an explicit live launch decision.
- `npm run validate:launch` fails production builds if prelaunch pricing metadata, script order, billing gating, youth safeguards, noindex protection, browser headers, or baseline accessibility safeguards regress.

### Youth-account privacy/safety guard
- The under-13 setup form now natively posts only the parent/guardian email to the protected `/api/parent-setup-request` endpoint; the old direct browser insert into `parent_setup_requests` has been removed.
- The endpoint design includes origin checks, uniform responses, service-role persistence, and durable rate limiting.
- Teen signup checks the entered date of birth before account creation and blocks the teen flow if the DOB indicates the learner is under 13 or otherwise invalid; a capture-phase guard remains as defense in depth.
- The launch validator now fails if `marketing.js` introduces any direct browser database insert.

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
- `docs/PRIVACY_LAUNCH_CHECKLIST.md` reflects the amended COPPA framework/current FTC compliance guidance, including written security-program, retention, processor-safeguard, parent-control, and privacy-notice requirements.

## Infrastructure status
- Supabase project `nrjqykfrnfrgyuvprwob` was rechecked and remains `INACTIVE`.
- It was **not restored automatically** because restoration can change hosted infrastructure/billing state.
- Content-system/provenance, calibration, marketing-measurement, privacy-request, and API-rate-limit migrations are committed but are **not claimed live**.
- Vercel continues to build automatically from `main`; every new hardening change must pass content, approval, SEO, security, and launch validation before a deployment can become green.

## Content rules still in force
- No question becomes commercially approved merely because automated validation passes.
- The 62 newer staged practice questions remain non-student-facing until independent accuracy, SAT/PSAT alignment, editorial, originality, and accessibility/bias review is completed and hash-valid approvals are applied.
- Current staged depth is 3 practice items per skill; the internal launch-readiness target remains 8 practice items and 6 diagnostic items per skill with minimum human-approved depth before broad commercial use.
- Any diagnostic item/answer key previously exposed in the public repository must not be reused as a secure commercial assessment item even if later independently reviewed.
- Diagnostic mastery values are learning signals, not official SAT/PSAT scaled-score predictions.
- No score-gain, admissions, scholarship, superiority, or guaranteed-outcome claims may be published without evidence.

## Explicitly not activated
- No Supabase restore or unapplied migration activation.
- No live Stripe activation, public purchase path, or approved public pricing/trial terms.
- No search indexing: prelaunch deployments are currently `noindex, nofollow, noarchive`.
- No paid media, ad spend, prospect email, affiliate/referral launch, social publishing, Search Console submission, or outbound campaign launch.
- No behavioral-advertising or learner-performance marketing audiences.
- No final legal/privacy policy publication.
- No identifiable student outcomes/reports used as marketing proof.

## Highest-priority next actions
1. Establish a **private repository/content boundary** before authoring/importing fresh secure commercial diagnostic questions; do not rely on historically public answer keys.
2. When Supabase is intentionally active, reconcile/apply pending migrations and run secure-v3 + RLS + production-content-approval + rate-limit end-to-end tests.
3. Independently review/approve practice content and create a fresh private diagnostic pool, then continue increasing rotation toward the 8-practice/6-diagnostic per-skill launch-depth target.
4. Complete full regression across student, parent, admin, onboarding, billing previews, uploads, learning, mastery, journey/progress, privacy requests, and support recovery.
5. Perform manual accessibility regression with keyboard-only navigation, screen reader, zoom/reflow, contrast, focus order, error announcements, and mobile touch targets.
6. Verify CSP/header/noindex behavior on the deployed production host and add platform-layer firewall/bot controls without treating them as substitutes for route authorization.
7. Reconcile the data inventory, processor register, retention schedule, final legal/privacy notices, live billing terms, analytics consent/attribution, lifecycle email, and campaign activation before public launch.
8. Only after explicit launch approval, remove the noindex header, submit search engines, activate approved analytics, and begin outbound marketing execution.

## Commercial launch gates still open
- Private proprietary-content boundary and fresh secure diagnostic bank.
- Active verified production database with migrations applied.
- Independent content review plus sufficient depth/rotation.
- Pilot calibration process after adequate data exists.
- Full end-to-end regression and production smoke testing.
- Minor-data/privacy/legal/data-retention and processor review.
- Manual accessibility review.
- Final RLS/API authorization and platform-layer firewall review.
- Live billing verification and approved pricing/trial terms.
- Approved analytics/attribution and outbound marketing activation.
