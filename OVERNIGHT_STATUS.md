# SATprep.io Commercial Launch Status

Last updated: 2026-08-24

## Current state
SATprep.io is a **pre-launch commercial candidate**, not approved for public paying customers. The codebase includes student/parent/admin/onboarding/billing flows, prior-assessment ingestion, an assessment-only adaptive diagnostic, server-scored guided practice with explanations, mastery/progress tracking, content review and calibration tooling, SEO/trust content, marketing/measurement plans, privacy/security controls, youth-account safeguards, accessibility checks, durable API rate limiting, and launch runbooks.

The latest committed main-branch changes add a fail-closed first-party measurement launch gate, privacy-minimized client wiring that remains inert during prelaunch, durable anonymous-event rate limiting, and short-lived hashed abuse-control counters. GitHub/Vercel deployment verification is still required for the newest commits because the connected Vercel team/project context is not currently discoverable through the deployment connector.

## Most recent launch hardening

### First-party measurement launch controls
- `launch-gates.json` now explicitly tracks `first_party_measurement`, which remains `disabled`.
- `MARKETING_MEASUREMENT_ENABLED=false` is documented as the server-side default. The `/api/marketing-event` route returns 404 unless that explicit server flag is enabled.
- The browser measurement module can now be loaded safely in prelaunch but remains inert unless the separate client launch flag is explicitly enabled before it initializes.
- When enabled later, measurement remains first-party and privacy-minimized: no cookies, localStorage IDs, account IDs, learner IDs, age/DOB, school data, test scores, diagnostic responses, or uploaded-report data are included in marketing events.
- The anonymous event endpoint is protected by the durable database-backed limiter. Vercel documents that it overwrites `x-forwarded-for` at the edge to prevent ordinary spoofing; the raw address is used only transiently as a limiter subject and is SHA-256 hashed before database storage.
- The rate-limit migration now opportunistically removes hashed limiter counters older than 48 hours so abuse-prevention identifiers do not accumulate indefinitely.
- Production launch validation now fails if measurement is activated accidentally, if the server-side fail-closed flag is removed, if anonymous event rate limiting is removed, or if the client module can send while its launch gate is disabled.

### Explicit commercial launch gates
- `launch-gates.json` is the repository-level source of truth for launch-sensitive state.
- Public indexing, public billing, live payments, first-party measurement, and outbound marketing remain explicitly disabled.
- The production launch validator fails closed if those controls are changed while the College Board trademark/naming review remains unresolved or before the corresponding launch approvals.
- The global Vercel `X-Robots-Tag: noindex, nofollow, noarchive` remains in place, so prepared SEO pages are not intentionally opened to public search indexing.

### College Board trademark/naming gate
- Current College Board trademark guidance was reviewed on 2026-08-24 and documented in `docs/TRADEMARK_LAUNCH_GATE.md`.
- The current product name/domain contains `SAT`, which College Board identifies as a registered mark. College Board's published guidance creates a material unresolved launch issue for third-party company/product/domain/advertising use of its marks.
- This is recorded as a **launch gate, not a legal conclusion**. Before indexing, advertising, affiliate promotion, broad social/PR execution, or public billing, the intended naming/domain/mark use must be addressed through appropriate permission/legal review or a rebrand/domain transition.
- `docs/BRAND_TRANSITION_PLAN.md` and `npm run brand:inventory` now provide a reversible technical migration path if a rebrand is chosen.
- The content boundary is explicit: do not copy/reproduce official College Board test questions in the commercial bank, and do not use College Board copyrighted test content to train a generative authoring system.

### Digital Math response-format fidelity
- Current College Board public specifications confirm Reading and Writing is four-option multiple choice while Math is approximately **75% MCQ / 25% student-produced response (SPR)**.
- Secure commercial content now supports `mcq` plus Math-only `spr` as first-class formats.
- Shared server scoring validates positive SPR entries to 5 characters and negative entries to 6 including the minus sign, supports integer/decimal/fraction entry, rejects symbols/mixed numbers/zero denominators, and handles exact terminating-decimal/fraction equivalence.
- Non-terminating-decimal questions can author explicit accepted forms, preserving reviewed rounding/truncation behavior.
- Secure guided practice renders SPR input, saves it durably, scores it server-side, and then provides correct/incorrect feedback, accepted answer, submitted answer when wrong, and explanation.
- Secure diagnostic renders and server-scores SPR without revealing correctness or explanations while assessment is in progress.
- A 20-question secure diagnostic now attempts a public-spec-style Math SPR mix when independently approved bank depth permits it, without allowing SPR in Reading and Writing.
- `docs/SPR_CONTENT_STANDARD.md` defines authoring/review rules and `validate:spr` adds regression coverage based on current public response-entry examples.

### Independent content review for MCQ and SPR
- Exact-hash review canonicalization now supports both MCQ answer indices and SPR accepted-response sets without invalidating the existing MCQ hash shape.
- Review export includes response format and accepted SPR answers.
- Private reviewed-content import supports MCQ or Math SPR, still requiring five approvals: accuracy, alignment, editorial, bias/accessibility, and originality.
- New response-storage migration adds mutually exclusive `selected_answer` / `response_text` fields to diagnostic and practice responses. It is committed but not live while Supabase remains inactive.

### Marketing-claims build gate
- `validate:marketing-claims` runs in every production build.
- Explicit affiliation/ownership representations such as College Board/SAT/PSAT “approved,” “authorized,” “certified,” or “official SATprep” are hard build failures.
- Potential score guarantees/outcome language is surfaced for prelaunch copy review.
- `docs/MARKETING_OPERATING_PLAN.md` includes a Phase 0 naming/trademark decision before SEO submission, ad accounts, campaigns, affiliates, social-page creation, PR, or broad public marketing.

## Product and content state
- Official SAT/PSAT taxonomy and structure are mapped to current College Board public specifications.
- The committed staged practice inventory contains **93 original items (3 per official skill point)** for development/review; newer items remain withheld behind independent review.
- Secure commercial content requires active `production_approved` status plus current exact-hash approvals for accuracy, SAT/PSAT alignment, editorial quality, bias/accessibility, and originality.
- Current questions whose answer keys have existed in public Git history are **not** suitable as the secure commercial diagnostic bank.
- Commercial depth target remains at least **8 practice items and 6 diagnostic items per official skill**, with multiple difficulty levels, MCQ/SPR coverage where applicable, independent review, and later pilot calibration.
- Diagnostic behavior remains assessment-only: no right/wrong teaching during the baseline assessment.
- Commercial practice gives right/wrong feedback, the correct/accepted answer, and instructional explanations, with server-side scoring and durable resume.

## Security, privacy, accessibility, and billing state
- Public checkout and checkout confirmation are server-gated and disabled on the public host unless explicit launch flags are enabled.
- Live Stripe use has a separate server-side lock; public test billing is not treated as production billing.
- First-party marketing measurement now has independent browser/server launch locks and remains disabled; when later approved it is designed to collect only privacy-minimized public-site events.
- Youth signup includes browser defense-in-depth plus a pending database age-gate migration; under-13 learners are routed through the parent/guardian workflow.
- Durable API abuse controls, privacy-request workflow, profile-privilege restrictions, content-integrity controls, secure diagnostic/practice sessions, and server-scored MCQ/SPR response protections are implemented in code/migrations.
- Production builds validate security, SPR scoring, practice security, adaptive practice, youth privacy, privilege boundaries, private content workflow, SEO, marketing claims, accessibility, launch state, and deterministic regression behavior.
- Automated accessibility checks are in place, but manual keyboard/screen-reader/zoom/contrast/device testing remains a launch requirement.

## Infrastructure state
- Supabase project `nrjqykfrnfrgyuvprwob` remains **INACTIVE** as of the latest check and was not restored automatically because restoration can affect hosted infrastructure/billing.
- Pending migrations include the content/review system, practice sessions, MCQ/SPR response storage, calibration, marketing measurement, privacy requests, durable API rate limits, profile privilege locking, and student-signup age gate. They are committed but **not claimed live**.
- GitHub repository is currently public. Fresh secure commercial question content should use the documented external private-review/import bridge and should ultimately live behind a dedicated private editorial/content boundary.
- Public indexing, live Stripe, ads, first-party measurement, public outbound email, affiliate/referral execution, Search Console submission, retargeting, social publishing, and final legal/privacy publication remain disabled.

## Highest-priority next actions
1. Resolve the **brand/domain/trademark launch gate** through documented permission/legal review or a rebrand/domain transition before indexing or outbound marketing.
2. Intentionally reactivate Supabase when approved; apply/reconcile pending migrations and test RLS, service-role, auth-trigger, rate-limit, privacy, content, MCQ/SPR diagnostic, practice, and measurement boundaries end to end.
3. Establish a dedicated private proprietary-content repository/editorial system and import fresh independently reviewed diagnostic/practice content with exact hash approvals.
4. Increase approved content depth/rotation/difficulty distribution and add a reviewed Math SPR mix toward the commercial targets.
5. End-to-end test secure diagnostic and commercial practice: MCQ/SPR entry, resume, adaptive bands, revoked approvals, right/wrong practice feedback, idempotency, atomic mastery updates, 429/503 behavior, and cross-account isolation.
6. Test direct teen signup versus parent-authorized under-13 activation after the age-gate migration is live.
7. Remove/decommission browser-writable mastery/question-attempt authority from the commercial path after server practice is proven live.
8. Complete full functional regression across student, parent, admin, onboarding, billing preview, prior uploads, progress/journey, privacy requests, support recovery, and disabled/enabled measurement states.
9. Complete manual accessibility and privacy/legal/data-retention/processor reviews.
10. Only after explicit approval and all applicable gates: enable public indexing/billing/analytics and begin outbound marketing execution.

## Launch gates still open
- College Board trademark/naming/domain resolution.
- Active verified production database with pending migrations applied.
- Dedicated private proprietary-content boundary and fresh secure diagnostic bank.
- Independent review plus sufficient content depth/rotation/difficulty distribution, including Math SPR.
- Commercial diagnostic/practice end-to-end verification and legacy browser-authority retirement.
- Youth-account/parental-consent end-to-end verification and final legal/privacy approval.
- Manual accessibility regression.
- Pilot calibration after adequate usage data.
- Full functional/security/privacy regression.
- Final legal/privacy/data-retention/processor review.
- Live billing/pricing/trial approval.
- Approved analytics/attribution and outbound marketing activation.
