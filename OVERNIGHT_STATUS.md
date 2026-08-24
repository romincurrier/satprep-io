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
- Production builds now run content, approval, SEO, accessibility, security, practice-security, launch, and deterministic regression validators before Vite.
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
- Content-system/hash-review, practice-session, calibration, marketing-measurement, privacy-request, and durable-rate-limit migrations are committed but **not claimed live**.
- GitHub repository is currently **public**. `docs/REPOSITORY_EXPOSURE.md` records the required private proprietary-content boundary before fresh secure commercial diagnostic content is authored/imported.
- Public search indexing remains disabled with prelaunch `X-Robots-Tag: noindex, nofollow, noarchive`.
- Live Stripe, public purchase/trial terms, ads, email campaigns, affiliate/referral execution, Search Console submission, public analytics/retargeting, and final legal/privacy publication remain disabled.

## Highest-priority next actions
1. Establish a **private repository/content boundary** for fresh secure commercial question content.
2. Intentionally reactivate Supabase when approved; apply/reconcile pending migrations and test RLS/service-role boundaries.
3. Import fresh independently reviewed diagnostic/practice content with exact hash-matching approval rows and increase depth toward launch targets.
4. End-to-end test secure diagnostic and commercial practice: resume, revoked-review behavior, correct/incorrect practice feedback, idempotent retries, atomic mastery, 429/503 failure modes, and cross-account isolation.
5. After server practice is proven live, remove/decommission browser-writable mastery/question-attempt authority from the commercial path and tighten legacy RLS without breaking prelaunch/legacy recovery.
6. Complete full regression across student, parent, admin, onboarding, billing preview, prior uploads, journey/progress, privacy requests, and support recovery.
7. Execute the manual accessibility checklist with keyboard, desktop/mobile screen readers, zoom/reflow, contrast, and representative devices; remediate all critical findings.
8. Reconcile live data inventory, processor register, retention schedule, legal/privacy notices, live billing terms, analytics consent/attribution, and lifecycle email before public launch.
9. Only after explicit approval: enable public billing/indexing/analytics and begin outbound marketing execution.

## Launch gates still open
- Private proprietary-content boundary + fresh secure diagnostic bank.
- Active verified production database with migrations applied.
- Independent review and sufficient content depth/rotation.
- Server-practice end-to-end verification and legacy/browser-authority retirement.
- Pilot calibration after adequate usage data.
- Full functional/security/privacy/accessibility regression.
- Final legal/privacy/data-retention/processor review.
- Live billing/pricing/trial approval.
- Approved analytics/attribution and outbound marketing activation.
