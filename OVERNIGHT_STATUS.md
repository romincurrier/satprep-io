# SATprep.io Commercial Launch Status

Last updated: 2026-08-25

## Current state
SATprep.io is a **pre-launch commercial candidate**, not approved for public paying customers. The codebase includes student/parent/admin/onboarding/billing flows, prior-assessment ingestion, an assessment-only adaptive diagnostic, server-scored guided practice with explanations, mastery/progress tracking, content review and calibration tooling, SEO/trust content, marketing/measurement plans, privacy/security controls, youth-account safeguards, accessibility checks, durable API rate limiting, and launch runbooks.

The newest main-branch hardening improves both secure-content scalability and diagnostic integrity. Secure diagnostic planning now scopes answer-key/review reads to exam-eligible candidate IDs in bounded chunks rather than scanning the complete proprietary scoring store. The private reviewed-content importer now screens exact and very-high-similarity content both within an incoming batch and against the existing production-approved bank, including **across diagnostic and practice content types**, so guided-practice exposure cannot silently compromise a supposedly unseen diagnostic item. Both safeguards are build-enforced, and the latest Vercel deployment is green. Live database migration reconciliation is still pending because Supabase management access is unavailable in this run; no alternate or unrelated Supabase project was touched.

## Most recent launch hardening

### Live-backend reconciliation guard
- `scripts/verify-live-backend.mjs` refuses to run against any Supabase project other than the expected SATprep.io project reference `ataaiocpbjavmdpgmzlv` unless an explicit expected-ref override is supplied.
- The live contract checks the commercial schema names and fields, including `item_id` plan/response links, Math SPR `response_text`, full practice-session provenance, content version/origin/review fields, privacy/rate-limit objects, first-party measurement storage, and calibration views.
- Browser-denial probes include proprietary content tables, diagnostic plans, practice sessions/plans/responses, rate-limit counters, marketing events, and calibration views.
- The verifier remains read-only: it does not restore projects, apply migrations, write student data, or invoke mutating RPCs.
- `npm run verify:backend` runs the explicit live read-only verification when the required Supabase environment values are available.
- `validate:backend-contract` performs a syntax check in every build without requiring production secrets.
- The exact live SATprep.io project `ataaiocpbjavmdpgmzlv` was previously reconnected and verified healthy. During the latest automation run the Supabase management tool remained unavailable before migration inspection, so no live database changes are claimed.

### Secure diagnostic content-read scoping
- Secure diagnostic planning first loads only active `production_approved` diagnostic item metadata, then filters by selected exam, supported response format, and official skill before requesting scoring/review material.
- Answer-key and independent-review reads are restricted to those eligible candidate item IDs rather than scanning the complete proprietary scoring/review tables.
- Candidate IDs are fetched in bounded 40-item chunks to avoid oversized query strings as the commercial bank grows.
- Ordered review history is preserved inside each item chunk, so the latest-decision exact-hash approval gate for accuracy, alignment, editorial, bias/accessibility, and originality is unchanged.
- `scripts/validate-diagnostic-bank-scope.mjs` fails the build if secure diagnostic planning regresses to broad answer-key/review-table scans or loses the bounded candidate loader.
- `validate:diagnostic-scope` runs in every production build; the deployment containing the scoped runtime and validator passed Vercel.

### Proprietary content duplication and diagnostic/practice separation
- `scripts/import-private-reviewed-content.mjs` now computes an ID-independent normalized content signature and refuses to import the same question content under a different item ID.
- The importer performs a conservative very-high-similarity token screen in addition to exact duplicate matching. This is a fail-closed editorial safeguard; it does not replace the required originality review.
- Incoming reviewed items are screened against one another **before any database writes** and against the existing `production_approved` commercial bank using paginated server-only reads.
- Duplicate signatures and near-duplicate comparisons intentionally span both `diagnostic` and `practice` content. A practice question cannot be recycled as a diagnostic item, or vice versa, merely by changing `content_type` or item ID.
- Similarity comparisons include stimulus, stem, and choices where present, while failure logs identify item IDs only and do not print proprietary question text.
- The private-content build validator enforces the duplicate screen, existing-bank pagination, status-only database errors, and diagnostic/practice separation contract.
- The first duplicate-screening deployment exposed an over-broad legacy validator regex; the validator was scoped to the REST helper rather than unrelated later errors, and the corrected production build passed Vercel.
- `docs/PRIVATE_CONTENT_WORKFLOW.md` now documents how blocked overlaps must be materially diversified and independently re-reviewed rather than bypassed with a new ID.

### First-party measurement launch controls
- `launch-gates.json` explicitly tracks `first_party_measurement`, which remains `disabled`.
- `MARKETING_MEASUREMENT_ENABLED=false` is documented as the server-side default. `/api/marketing-event` returns 404 unless that explicit server flag is enabled.
- The browser measurement module is present for launch readiness but remains inert unless a separate client launch flag is explicitly enabled before initialization.
- Even after future approval, the client measures only public acquisition surfaces; authenticated `?app=1`, billing UI, checkout return, and billing-success modes are excluded.
- The receiving API requires an approved browser `Origin`; originless and cross-origin submissions are rejected.
- Event names are allowlisted and payload/field lengths are bounded.
- Measurement remains privacy-minimized: no cookies, localStorage IDs, account IDs, learner IDs, age/DOB, school data, test scores, diagnostic responses, skill mastery, uploaded-report data, or parent-child linkage are included.
- Email-like and phone-like values in campaign/referral fields are discarded server-side instead of being stored.
- The anonymous event endpoint is protected by the durable database-backed limiter. The raw address is used only transiently as a limiter subject and is SHA-256 hashed before database storage.
- The rate-limit migration opportunistically removes hashed limiter counters older than 24 hours, aligned with the proposed retention target.
- `migrations/20260825_marketing_events_privilege_lock.sql` explicitly revokes the measurement table and its identity sequence from `public`, `anon`, and `authenticated`, granting only the minimum service-role privileges needed for trusted server ingestion. This migration is staged and **not claimed live** until database reconciliation succeeds.
- Production launch validation fails if measurement is activated accidentally, if the server fail-closed flag is removed, if public-surface/origin/contact-data boundaries disappear, if anonymous rate limiting is removed, or if the client can send while its launch gate is disabled.
- `docs/API_ABUSE_CONTROLS.md` documents the anonymous measurement threat model, route limit, raw-IP prohibition, short retention, and required QA cases.

### Explicit commercial launch gates
- `launch-gates.json` is the repository-level source of truth for launch-sensitive state.
- Public indexing, public billing, live payments, first-party measurement, and outbound marketing remain explicitly disabled.
- The production launch validator fails closed if those controls are changed while the College Board trademark/naming review remains unresolved or before the corresponding launch approvals.
- The global Vercel `X-Robots-Tag: noindex, nofollow, noarchive` remains in place, so prepared SEO pages are not intentionally opened to public search indexing.

### College Board trademark/naming gate
- Current College Board trademark guidance was reviewed on 2026-08-24 and documented in `docs/TRADEMARK_LAUNCH_GATE.md`.
- The current product name/domain contains `SAT`, which College Board identifies as a registered mark. College Board's published guidance creates a material unresolved launch issue for third-party company/product/domain/advertising use of its marks.
- This is recorded as a **launch gate, not a legal conclusion**. Before indexing, advertising, affiliate promotion, broad social/PR execution, or public billing, the intended naming/domain/mark use must be addressed through appropriate permission/legal review or a rebrand/domain transition.
- `docs/BRAND_TRANSITION_PLAN.md` and `npm run brand:inventory` provide a reversible technical migration path if a rebrand is chosen.
- The content boundary is explicit: do not copy/reproduce official College Board test questions in the commercial bank, and do not use College Board copyrighted test content to train a generative authoring system.

### Digital Math response-format fidelity
- Current College Board public specifications confirm Reading and Writing is four-option multiple choice while Math is approximately **75% MCQ / 25% student-produced response (SPR)**.
- Secure commercial content supports `mcq` plus Math-only `spr` as first-class formats.
- Shared server scoring validates positive SPR entries to 5 characters and negative entries to 6 including the minus sign, supports integer/decimal/fraction entry, rejects symbols/mixed numbers/zero denominators, and handles exact terminating-decimal/fraction equivalence.
- Non-terminating-decimal questions can author explicit accepted forms, preserving reviewed rounding/truncation behavior.
- Secure guided practice renders SPR input, saves it durably, scores it server-side, and then provides correct/incorrect feedback, accepted answer, submitted answer when wrong, and explanation.
- Secure diagnostic renders and server-scores SPR without revealing correctness or explanations while assessment is in progress.
- A 20-question secure diagnostic attempts a public-spec-style Math SPR mix when independently approved bank depth permits it, without allowing SPR in Reading and Writing.
- `docs/SPR_CONTENT_STANDARD.md` defines authoring/review rules and `validate:spr` adds regression coverage based on current public response-entry examples.

### Independent content review for MCQ and SPR
- Exact-hash review canonicalization supports both MCQ answer indices and SPR accepted-response sets without invalidating the existing MCQ hash shape.
- Review export includes response format and accepted SPR answers.
- Private reviewed-content import supports MCQ or Math SPR, requiring five approvals: accuracy, alignment, editorial, bias/accessibility, and originality.
- Response-storage migration adds mutually exclusive `selected_answer` / `response_text` fields to diagnostic and practice responses. It is committed but not claimed live until backend reconciliation verifies it.

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
- Secure diagnostic planning limits answer-key/review reads to the exam-eligible candidate bank in bounded chunks before exact-hash approval filtering, improving privacy and scalability as the proprietary bank grows.
- The private import bridge now rejects diagnostic/practice content overlap as well as same-bank duplicates before production approval can be written, reducing the risk that a learner sees a diagnostic answer through guided practice.
- Commercial practice gives right/wrong feedback, the correct/accepted answer, and instructional explanations, with server-side scoring and durable resume.
- New practice planning uses up to the learner's 50 most recent trusted server-scored responses as a recency signal. Within each adaptive target difficulty, unseen content is preferred first; if every suitable item has been seen, the least-recently-used item is preferred. Math SPR balancing uses the same freshness preference, reducing avoidable repetition while preserving the difficulty plan and best-effort format mix.
- The adaptive-practice regression suite covers the fresh-item preference and the least-recently-used fallback, and the production practice-security validator enforces that the runtime continues using trusted response history rather than silently regressing to random repeat selection.

## Security, privacy, accessibility, and billing state
- Public checkout and checkout confirmation are server-gated and disabled on the public host unless explicit launch flags are enabled.
- Live Stripe use has a separate server-side lock; public test billing is not treated as production billing.
- First-party marketing measurement has independent browser/server launch locks and remains disabled; when later approved it is designed for public acquisition surfaces only and collects privacy-minimized events.
- Youth signup includes browser defense-in-depth plus a pending database age-gate migration; under-13 learners are routed through the parent/guardian workflow.
- Durable API abuse controls, privacy-request workflow, profile-privilege restrictions, content-integrity controls, secure diagnostic/practice sessions, and server-scored MCQ/SPR response protections are implemented in code/migrations.
- Production builds validate security, diagnostic content-read scoping, SPR scoring, practice security, adaptive practice, youth privacy, privilege boundaries, private content workflow including cross-bank duplication controls, SEO, marketing claims, accessibility, backend-contract syntax, launch state, and deterministic regression behavior.
- Automated accessibility checks are in place, but manual keyboard/screen-reader/zoom/contrast/device testing remains a launch requirement.

## Infrastructure state
- The intended live Supabase backend is **SATprep.io**, project reference `ataaiocpbjavmdpgmzlv`; it was previously reconnected and verified healthy.
- Supabase management access is intermittent. It was unavailable during the latest migration-reconciliation attempt, so pending migrations are still **not claimed live** and no other Supabase project was modified.
- Pending migrations include the content/review system, practice sessions, MCQ/SPR response storage, calibration, marketing measurement and its explicit privilege lock, privacy requests, durable API rate limits, profile privilege locking, and student-signup age gate. They must be compared with the live migration history and applied only where missing.
- GitHub repository is currently public. Fresh secure commercial question content should use the documented external private-review/import bridge and should ultimately live behind a dedicated private editorial/content boundary.
- GitHub/Vercel deployment verification is working. The latest substantive main branch includes secure-diagnostic candidate-scoped review reads plus cross-bank proprietary-content duplicate screening; the corrected production build deployed successfully on Vercel.
- Direct Vercel build-log access through the connector is not currently authorized to the project scope, but GitHub's Vercel deployment status is available and green for the latest substantive build.
- Public indexing, live Stripe, ads, first-party measurement, public outbound email, affiliate/referral execution, Search Console submission, retargeting, social publishing, and final legal/privacy publication remain disabled.

## Highest-priority next actions
1. Reconnect/obtain stable management access to the exact Supabase project `ataaiocpbjavmdpgmzlv`; compare live migration history, apply only missing migrations, run security/performance advisors, and execute `npm run verify:backend` plus account-boundary/RLS testing.
2. Establish a dedicated private proprietary-content repository/editorial system and import fresh independently reviewed diagnostic/practice content with exact hash approvals.
3. Increase approved content depth/rotation/difficulty distribution and add a reviewed Math SPR mix toward the commercial targets, preserving the enforced diagnostic/practice separation.
4. End-to-end test secure diagnostic and commercial practice: MCQ/SPR entry, resume, adaptive bands, least-recently-used rotation, revoked approvals, right/wrong practice feedback, idempotency, atomic mastery updates, 429/503 behavior, and cross-account isolation.
5. Test direct teen signup versus parent-authorized under-13 activation after the age-gate migration is live.
6. Remove/decommission browser-writable mastery/question-attempt authority from the commercial path after server practice is proven live.
7. Complete full functional regression across student, parent, admin, onboarding, billing preview, prior uploads, progress/journey, privacy requests, support recovery, and disabled/enabled measurement states.
8. Complete manual accessibility and privacy/legal/data-retention/processor reviews.
9. Resolve the brand/domain/trademark launch gate before indexing or outbound marketing.
10. Only after explicit approval and all applicable gates: enable public indexing/billing/analytics and begin outbound marketing execution.

## Launch gates still open
- Stable verified production database with pending migrations reconciled/applied.
- Dedicated private proprietary-content boundary and fresh secure diagnostic bank.
- Independent review plus sufficient content depth/rotation/difficulty distribution, including Math SPR and maintained diagnostic/practice separation.
- Commercial diagnostic/practice end-to-end verification and legacy browser-authority retirement.
- Youth-account/parental-consent end-to-end verification and final legal/privacy approval.
- Manual accessibility regression.
- Pilot calibration after adequate usage data.
- Full functional/security/privacy regression.
- Final legal/privacy/data-retention/processor review.
- Brand/domain/trademark resolution before public indexing/outbound marketing.
- Live billing/pricing/trial approval.
- Approved analytics/attribution and outbound marketing activation.
