# SATprep.io Commercial Launch Status

Last updated: 2026-08-24

## Current state
SATprep.io is a **pre-launch commercial candidate**, not approved for public paying customers. The repository now contains substantial student/parent/admin/billing/onboarding functionality, prior-assessment ingestion, an assessment-only adaptive diagnostic, guided learning/practice with explanations, mastery/progress tracking, content QA/review tooling, SEO/trust content, marketing plans, privacy/security operating materials, durable API abuse controls, and baseline accessibility/security hardening.

## Latest completed engineering

### Server-enforced public billing launch locks
- Public checkout is no longer protected only by browser UI/prelaunch code. The Stripe server layer now identifies `satprep.io` and `www.satprep.io` as public hosts and fails closed unless an explicit server-side public billing flag is enabled.
- Checkout creation **and checkout confirmation** both require `PUBLIC_BILLING_ENABLED=true` on the public host.
- Billing-portal access is independently gated by `PUBLIC_BILLING_PORTAL_ENABLED=true`, so post-purchase account management can be controlled separately from new sales.
- A public production host must also use a live Stripe key; test-mode public checkout is refused unless the emergency/test-only `ALLOW_PUBLIC_TEST_BILLING=true` override is deliberately set.
- Existing `ALLOW_LIVE_BILLING=true` remains a separate lock before any `sk_live_*` key can be used.
- Preview/non-public hosts can continue Stripe test-mode QA without opening public commerce.
- `env.example` defaults every public/live billing control to `false`, and the production security validator now fails builds if these server-side gates are removed or bypassed.
- A Vercel build containing these billing controls and the expanded security validation completed successfully.

### Accessibility regression foundation
- Added `npm run validate:accessibility` to every production build.
- The validator scans public HTML and the application shell for document language, viewport/title/main landmarks, one primary H1, safe keyboard order, image alt text, safe new-window links, accessible tables, labeled static form controls, application skip navigation, visible focus treatment, and reduced-motion support.
- Public educational/SEO pages now have consistent visible keyboard focus, minimum touch-target treatment for primary controls, screen-reader utility styles, and reduced-motion support.
- The 2026–27 SAT dates table now has a screen-reader caption and scoped column headers.
- Added `docs/ACCESSIBILITY_LAUNCH_CHECKLIST.md` covering keyboard-only, screen-reader, zoom/reflow, contrast, touch, motion/timing, math/content accessibility, and release-evidence testing. Automated checks are explicitly **not** treated as proof of legal compliance or a substitute for manual assistive-technology testing.
- The first Vercel build with the accessibility validator enabled completed successfully.

### Youth-account privacy boundary
- Added a database auth-trigger migration that requires a valid date of birth for **direct student signup** and rejects direct creation for students under 13, routing that age group to the existing parent/guardian workflow instead of relying only on browser JavaScript.
- Parent/guardian-created student logins now carry a trusted `raw_app_meta_data` provenance marker set by the server admin-user path. The auth trigger recognizes that marker so a parent-created child account does not need to masquerade as a direct teen signup.
- This intentionally uses `raw_app_meta_data`, not user-editable `raw_user_meta_data`, for the trusted authorization marker.
- Added `validate:youth-privacy` to every production build so the under-13 UI route, parent setup endpoint, direct-signup DOB requirement, trusted parent activation metadata, parental-consent event, and database age gate cannot silently regress.
- A Vercel build containing the youth privacy validator completed successfully.
- These controls are technical defense in depth only; they do **not** substitute for final COPPA/state privacy/legal review, consent wording/verification, revocation, retention, and deletion procedures.

### Private proprietary-content bridge
- Added `.gitignore` protection for local environment files, build artifacts, private-content directories, and completed review CSVs so proprietary review material is less likely to be committed accidentally to the public repository.
- Added `scripts/import-private-reviewed-content.mjs`, which accepts only an **absolute path** to a review file outside the repository, validates all five required independent approvals, recomputes the exact SHA-256 reviewed-content hash, and imports content through the server-only Supabase service credential without printing proprietary question text.
- Private imports default to **inactive**. Activation additionally requires `--activate` plus `PRIVATE_CONTENT_IMPORT_CONFIRM=ACTIVATE_REVIEWED_CONTENT`.
- Existing items are deactivated before replacement and are only reactivated after prompt, answer key, and review writes succeed.
- Added `docs/PRIVATE_CONTENT_WORKFLOW.md`. This provides a safe bridge for fresh commercial content without placing new secure diagnostic/practice questions in public Git, while still identifying a dedicated private repository/editorial CMS as the mature long-term solution.

### Exact-content diagnostic approval integrity
- Secure diagnostic content is typed as `diagnostic` in the server-only content system.
- Runtime selection/delivery/scoring requires active `production_approved` MCQ content plus current approvals for **accuracy, SAT/PSAT alignment, editorial quality, bias/accessibility, and originality**.
- Review approvals are SHA-256 hash-pinned to the exact current prompt, choices, answer key, explanation, taxonomy, difficulty, exam eligibility, and content type.
- If content changes after review, the secure runtime fails closed even if the row still says `production_approved`.
- Review history uses the latest decision for each required review type, so a later revise/reject overrides an older approval.

### Secure diagnostic planning boundary
- Added `diagnostic-plan-core.js`, a pure dependency-injected planner that receives only an already-approved bank.
- The secure planning dependency graph no longer imports the committed development question bank merely to use the planning algorithm.
- Diagnostic planning remains deterministic per seed and retains the 20-item blueprint with all eight official domains represented.

### Commercial practice v3 foundation
- Added server-only `practice_sessions`, `practice_session_items`, and `practice_responses` schema/migration.
- Added authenticated `/api/practice-session-v3`, `/api/practice-item-v3`, and `/api/practice-answer-v3` routes with durable rate limiting and payload/UUID/answer validation.
- Commercial practice uses only active `production_approved` content typed as `practice`, with the same five current hash-matching review approvals.
- The browser receives one safe question at a time without answer/explanation material. After submission, the server returns correct/incorrect feedback, the correct answer, and the instructional explanation.
- Practice sessions are durable and resume at the next unanswered item after refresh/new browser window.
- Added service-role-only `finalize_practice_session(uuid)` RPC that row-locks the session and atomically updates trusted `skill_mastery`, `lesson_progress`, and session completion exactly once.
- `learning-v2.js` now attempts server practice first. The old browser-scored flow is explicitly a **prelaunch-only QA fallback**. When commercial mode is enabled, it fails closed instead of silently using browser-scored mastery.
- Added `docs/COMMERCIAL_PRACTICE_ARCHITECTURE.md` with activation/test requirements.

### Build-time regression/security gates
- Production builds now run content, approval, SEO, accessibility, youth-privacy, security, practice-security, launch, and deterministic regression validators before Vite.
- Diagnostic regression tests preserve assessment-only behavior and deterministic all-domain coverage.
- Practice security tests enforce authenticated/rate-limited APIs, server-only scoring content, exact hash approvals, durable resume, atomic mastery finalization, and prelaunch-only browser fallback.
- Continue requiring a green deployment check after every material commit.

## Content state
- Official SAT/PSAT taxonomy/structure is mapped to current College Board source material.
- Staged practice inventory: **93 original items (3 per official skill point)**; newer items remain withheld behind independent review.
- Current committed/public diagnostic questions are suitable only for internal taxonomy/UI/blueprint QA. Because answer keys have existed in public Git history, they must **not** become the secure commercial diagnostic bank.
- Commercial depth target remains at least **8 practice items and 6 diagnostic items per official skill**, with minimum independently approved depth and later empirical calibration.
- No automated validation substitutes for independent content review.

## Infrastructure state
- Supabase project `nrjqykfrnfrgyuvprwob` remains **INACTIVE** and was not restored automatically because restoration can affect hosted infrastructure/billing.
- Content-system/hash-review, practice-session, calibration, marketing-measurement, privacy-request, durable-rate-limit, and student-signup-age-gate migrations are committed but **not claimed live**.
- GitHub repository is currently **public**. The new private-file/import workflow reduces accidental exposure, but a dedicated private proprietary-content repository/CMS is still recommended before scaled commercial authoring.
- Public search indexing remains disabled with prelaunch `X-Robots-Tag: noindex, nofollow, noarchive`.
- Live Stripe, public purchase/trial terms, ads, email campaigns, affiliate/referral execution, Search Console submission, public analytics/retargeting, and final legal/privacy publication remain disabled.

## Highest-priority next actions
1. Establish a dedicated **private repository/editorial content boundary** for scaled fresh commercial question authoring; use the new external-file import bridge meanwhile.
2. Intentionally reactivate Supabase when approved; apply/reconcile pending migrations and test RLS/service-role/auth-trigger boundaries.
3. Import fresh independently reviewed diagnostic/practice content with exact hash-matching approval rows and increase depth toward launch targets.
4. End-to-end test secure diagnostic and commercial practice: resume, revoked-review behavior, correct/incorrect practice feedback, idempotent retries, atomic mastery, 429/503 failure modes, and cross-account isolation.
5. End-to-end test teen direct signup versus parent-authorized under-13 account activation after the age-gate migration is applied.
6. After server practice is proven live, remove/decommission browser-writable mastery/question-attempt authority from the commercial path and tighten legacy RLS without breaking prelaunch/legacy recovery.
7. Complete full regression across student, parent, admin, onboarding, billing preview, prior uploads, journey/progress, privacy requests, and support recovery.
8. Execute the manual accessibility checklist with keyboard, desktop/mobile screen readers, zoom/reflow, contrast, and representative devices; remediate all critical findings.
9. Reconcile live data inventory, processor register, retention schedule, legal/privacy notices, consent verification, live billing terms, analytics consent/attribution, and lifecycle email before public launch.
10. Only after explicit approval: enable public billing/indexing/analytics and begin outbound marketing execution.

## Launch gates still open
- Dedicated private proprietary-content boundary + fresh secure diagnostic bank.
- Active verified production database with migrations applied.
- Independent review and sufficient content depth/rotation.
- Server-practice end-to-end verification and legacy/browser-authority retirement.
- Youth-account/parental-consent end-to-end verification plus legal/privacy approval.
- Pilot calibration after adequate usage data.
- Full functional/security/privacy/accessibility regression.
- Final legal/privacy/data-retention/processor review.
- Live billing/pricing/trial approval.
- Approved analytics/attribution and outbound marketing activation.
