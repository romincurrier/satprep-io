# SATprep.io Commercial Launch Readiness Checklist

Updated: 2026-08-26

This file is the single operating checklist for commercial launch readiness. `docs/COMMERCIAL_LAUNCH_RUNBOOK.md` remains the detailed procedure; this checklist tracks what is actually complete and what still blocks launch.

**Launch-ready definition:** every item in **BLOCKING BEFORE COMMERCIAL LAUNCH** must be complete, all owner/manual activation items must be intentionally approved, and the release-candidate build plus production-equivalent end-to-end regression must be green. Items under **IMPORTANT BEFORE / IMMEDIATELY AFTER LAUNCH** should be completed unless explicitly accepted as a documented launch exception.

## Current launch controls

- [x] College Board independence disclosure is required and implemented on the public homepage.
- [x] Production build validation fails if the independence disclosure disappears.
- [x] Public indexing remains disabled.
- [x] Public billing remains disabled.
- [x] Live payments remain disabled.
- [x] First-party marketing measurement remains disabled.
- [x] Outbound marketing remains disabled.
- [x] Unreviewed proprietary questions remain inactive/unapproved.
- [x] Production backend identity is reconciled to Supabase project `ataaiocpbjavmdpgmzlv` using live schema inspection.
- [x] Production CSP permits only the active Supabase HTTPS/WSS origin, rejects the retired project origin, and is enforced by a production build validator.
- [x] Production builds fail if browser source or built output exposes server-only environment names, privileged Supabase JWTs, or credential-shaped Stripe/OpenAI/GitHub/AWS secrets.
- [x] All 24 foreign-key paths flagged by the production Supabase performance advisor are now covered by narrow indexes with no RLS, grant, content, or application-authority changes. A fresh advisor run reports **0 `unindexed_foreign_keys` findings**.
- [x] Parent invitation acceptance is atomic and service-role-only: household/profile/student/link/invitation/consent changes commit in one row-locked database transaction with no new browser grants.
- [x] Secure-v3 diagnostic answer submission is atomic and service-role-only: each attempt is row-locked, the persisted question plan/current position is verified, changed retries are rejected, and identical retries are idempotent before finalization.
- [x] Secure-v3 diagnostic finalization is atomic and service-role-only: attempt completion, learner diagnostic/path state, and diagnostic-derived mastery now commit in one row-locked transaction, incomplete attempts are rejected, and repeated finalization is idempotent.
- [x] Production enforces at most one `in_progress` diagnostic attempt per learner, preventing concurrent refresh/new-tab/new-device session races from forking assessment state.
- [x] A production parent/student/admin RLS authorization-equivalence baseline is captured in `docs/RLS_AUTHORIZATION_EQUIVALENCE.md` and has been verified with authenticated-role, cross-household, and read-only-parent checks before any RLS performance rewrite.
- [x] The profile-backed administrator RLS helper is no longer exposed as a public SECURITY DEFINER RPC: all 19 dependent policies use a pinned-search-path helper in the non-Data-API `private` schema, and a fresh production security-advisor review reports no executable SECURITY DEFINER warning.

# BLOCKING BEFORE COMMERCIAL LAUNCH

## 1. Commercial content bank

**Staging progress (2026-08-26):** the private Google Drive staging bank contains **94 assistant-staged, unapproved drafts: 47 diagnostic and 47 practice items**. All **31 official skill keys** represented by the current taxonomy have at least one diagnostic draft and one practice draft. The newest 62-item expansion added one difficulty-1 diagnostic and one difficulty-1 practice draft for every skill and includes **10 Math SPR items**. This is authoring inventory only: every row remains `production_approved=FALSE`. A fresh production query on 2026-08-26 confirms `public.content_items` still contains **0 rows, 0 active items, and 0 items with `qa_status='production_approved'`**. The next autonomous authoring passes should fill difficulty-2 and difficulty-3/depth gaps; independent human review remains mandatory before any production import, approval, or activation.

- [ ] Reach the commercial depth target for every exam-eligible skill: at least 6 approved diagnostic items and 8 approved practice items per skill, with required difficulty distribution.
- [ ] Maintain sufficient Math student-produced-response representation in the reviewed bank.
- [ ] Complete independent review for every launch item across accuracy, alignment, editorial, bias/accessibility, and originality.
- [ ] Satisfy reviewer-independence policy: at least three distinct reviewer labels across the five dimensions and no reviewer approving more than two dimensions on one item.
- [ ] Generate exact content hashes for the reviewed versions and ensure no item changed after review.
- [ ] Pass duplicate/near-duplicate screening across both diagnostic and practice pools.
- [ ] Import independently reviewed content into production **inactive first**.
- [ ] Run `npm run verify:launch-content` successfully against the exact production project.
- [ ] Perform controlled runtime QA against the inactive reviewed bank.
- [ ] Activate only items that pass review, hash, duplicate, taxonomy, answer/explanation, and runtime checks.

**Human-review dependency:** independent content approval cannot be self-certified by the authoring automation.

## 2. Secure-v3 full journey acceptance

- [ ] Create fresh synthetic parent and student test accounts for production-equivalent acceptance.
- [ ] Verify parent signup creates exactly one household and correct billing-owner state.
- [ ] Verify direct student signup age gate and parent-authorized under-13 flow.
- [ ] Verify email confirmation/sign-in/sign-out/password-recovery behavior.
- [ ] Verify parent-created student login and parent/student linking authorization.
- [x] Verify invitation expiration/reuse behavior.
- [ ] Verify prior-assessment upload flow with supported file types and representative synthetic/redacted reports.
- [ ] Verify a fresh learner starts secure-v3 diagnostic.
- [x] Verify diagnostic item payload never contains answer keys, explanations, or distractor rationales.
- [x] Verify diagnostic question order cannot be skipped or forged at the secure API/trusted-database boundaries.
- [x] Verify duplicate answer submissions are idempotent at the trusted production database boundary and that changed/out-of-sequence retries are rejected.
- [ ] Verify refresh, new tab, and new-device resume behavior in production-equivalent browser acceptance.
- [ ] Verify temporary network failure does not lose saved answers in production-equivalent fault-injection acceptance.
- [ ] Verify diagnostic feedback remains withheld until assessment completion.
- [x] Verify atomic/idempotent diagnostic finalization at the trusted database boundary: incomplete attempts do not finalize, a complete attempt writes learner diagnostic/mastery state once, and a repeated finalization is a no-op.
- [ ] Verify full browser/API secure-v3 diagnostic completion updates the learning model exactly once with independently reviewed content.
- [ ] Verify recommended learning path reflects prior evidence plus diagnostic evidence in full secure-v3 acceptance.
- [ ] Verify guided practice uses the secure server-scored bank and cannot fall back to browser scoring in commercial mode.
- [ ] Verify MCQ and Math SPR practice scoring.
- [ ] Verify every practice response returns appropriate instructional feedback only after scoring.
- [ ] Verify practice completion updates mastery/lesson progress exactly once.
- [ ] Verify parent progress accurately reflects trusted server-scored learning state.
- [ ] Verify administrator overview remains role-restricted and presentation-minimized.

**Invitation hardening status (2026-08-26):** production migration `atomic_parent_invitation_acceptance` is applied. Invitation acceptance locks the parent, invitation, student, and existing household as applicable and performs household creation/linking, invitation consumption, and the existing consent-record write in one transaction. The RPC is `SECURITY INVOKER`, has a fixed search path, and live privilege checks confirm `anon=FALSE`, `authenticated=FALSE`, `service_role=TRUE` for execution. The application calls only this trusted RPC for acceptance, and the production build contract checks enforce that architecture. A rollback-only synthetic transaction against the actual production schema verifies that an expired invitation returns `invitation_expired` and is marked expired, a valid invitation is accepted exactly once, reuse returns `invitation_unavailable`, and no duplicate parent/student link or consent row is created. Post-test queries confirm no synthetic profile or student rows persisted.

**Diagnostic-answer hardening status (2026-08-26):** production migration `atomic_diagnostic_response_submission` is applied and the secure-v3 server path now calls `submit_diagnostic_response_secure_v3` rather than inserting diagnostic responses directly. The RPC is `SECURITY INVOKER`, row-locks the attempt, verifies the secure-v3 persisted plan and current question position, derives content metadata from an active production-approved item, and is executable by `service_role` only (`anon=FALSE`, `authenticated=FALSE`, `service_role=TRUE`). A rollback-only synthetic transaction against the production schema verified that an out-of-sequence response is rejected, the first valid response is recorded once, an identical retry returns idempotently without creating another row, a changed retry is rejected, and the next valid response advances exactly once. Post-test queries confirmed **0 synthetic students, 0 synthetic content rows, and 0 synthetic response rows persisted**; production proprietary content remains **0 total / 0 active / 0 production-approved**. A dedicated build regression guard fails if the application stops using the atomic RPC, restores direct response inserts, loses row locking/sequence enforcement, weakens identical-retry idempotency, or grants browser execution authority.

**Diagnostic resume/recovery hardening status (2026-08-26):** production migration `diagnostic_resume_single_active_attempt` is applied. A partial unique index now guarantees at most one `in_progress` diagnostic attempt per learner; a rollback-only production-schema test confirmed a second active attempt for the same learner is rejected while the first remains intact and no synthetic active attempt persists after rollback. The secure-v3 session endpoint reuses the latest open attempt and returns its trusted server-scored answer count; the item endpoint enforces the next unanswered position; diagnostic payloads are projected through an allowlist that omits scoring keys/explanations/rationales; and the browser recovery path reconciles an uncertain answer POST against durable server progress before permitting the same idempotent answer to be retried. The production build acceptance-flow validator now fails if these resume, recovery, safe-payload, sequence, or single-active-attempt invariants are removed. Live browser refresh/new-tab/new-device and network fault-injection acceptance remain explicitly open until a reviewed secure-v3 content bank is available.

**Diagnostic-finalization hardening status (2026-08-26):** production migration `atomic_diagnostic_finalization` is applied and the secure-v3 server path now calls `finalize_diagnostic_attempt_secure_v3` rather than performing sequential attempt/student/mastery writes. The RPC is `SECURITY INVOKER`, row-locks the attempt and learner, verifies every planned response is present and server-scored before completion, preserves pre-existing recommended-path state while merging diagnostic results, and is executable by `service_role` only (`anon=FALSE`, `authenticated=FALSE`, `service_role=TRUE`). A rollback-only synthetic transaction against the production schema verified that an incomplete attempt remains in progress, a fully answered attempt commits diagnostic/path/mastery state, and a repeated finalization cannot change or double-count mastery. Post-test queries confirmed **0 synthetic students, 0 synthetic content rows, and 0 synthetic attempts persisted**. A dedicated build regression guard now fails if the application stops using the atomic RPC or reintroduces sequential mastery finalization. Full browser/API diagnostic completion remains blocked by the independent reviewed-content requirement and is tracked separately above.

## 3. Final trusted-learning authority lock

- [ ] Complete secure-v3 end-to-end acceptance before changing legacy authority.
- [ ] Apply `trusted_learning_authority` migration to production.
- [ ] Verify browser roles can no longer insert/update/delete `skill_mastery`, `lesson_progress`, or legacy `question_attempts`.
- [ ] Verify secure diagnostic/practice server paths still update mastery and lesson progress correctly after the lock.
- [ ] Re-run Supabase security/performance advisors and production build validation.

## 4. Authentication/security launch acceptance

- [x] Public email/account enumeration RPC removed from browser access.
- [x] Browser profile authority restricted to non-privileged name fields.
- [x] Same-origin protection covers privileged student/parent/diagnostic/practice/billing paths.
- [x] Durable service-only API rate limiting is live.
- [x] Proprietary content, answer keys, diagnostic plans, secure practice responses, rate-limit counters, and marketing events are not browser-readable.
- [x] Repository deployment guard rejects a retired/wrong Supabase CSP endpoint, Supabase wildcard origins, `unsafe-eval`, premature removal of `noindex`, and weakened baseline permissions controls.
- [x] Current worktree and production browser bundle are protected by a build-time secret-boundary validator.
- [x] Establish and record the production parent/student/admin authorization-equivalence baseline before any RLS performance rewrites.
- [ ] Complete a launch-relevant repository-history secret scan and rotate/revoke any credential if historical exposure is found; the current connector can validate the present tree/build but does not certify every historical Git object.
- [ ] Enable Supabase Auth leaked-password protection.
- [x] Refactor the exposed `public.is_admin()` SECURITY DEFINER helper into a non-Data-API private helper, preserve RLS authorization equivalence, and eliminate the advisor warning.
- [ ] Run the final release-candidate Supabase security-advisor review after remaining launch migrations/configuration are frozen.
- [ ] Run a release-candidate dependency/security review.
- [ ] Verify production security headers on the final public candidate.
- [ ] Complete basic abuse testing on signup, invitations, diagnostic/practice submission, privacy requests, and billing endpoints.

**Current advisor status (2026-08-26):** production remains healthy. Migration `private_admin_rls_helper` moved the profile-backed recursive-safe administrator predicate from exposed `public.is_admin()` to `private.is_admin()` with an empty pinned search path, removed the public helper, and rewired all 19 dependent RLS policies through `(select private.is_admin())` without changing policy role targets or commands. Live privilege checks show `anon` cannot use the private schema or execute the helper, while `authenticated` can execute it only for policy evaluation and `service_role` retains trusted access. Parent/student/admin role-emulation checks preserved the recorded authorization-equivalence baseline. A fresh security-advisor review no longer reports the executable SECURITY DEFINER warning; the only remaining actionable security warning is that leaked-password protection is disabled. Service-only RLS-with-no-policy findings remain informational and fail-closed by design.

**Authorization-equivalence status (2026-08-26):** production role-emulation checks verified that the current parent can see the linked learner and linked diagnostic state but not an unrelated learner or unrelated diagnostic; the parent cannot directly update diagnostic attempts; a student can see self-owned learner/diagnostic state but not another learner; and the administrator retains the intended complete operational view. The same baseline was re-run after `private_admin_rls_helper`: parent/student cross-tenant isolation remained intact and the administrator retained the complete intended operational view. The reusable baseline and safe-change rules are recorded in `docs/RLS_AUTHORIZATION_EQUIVALENCE.md`. This baseline must be re-run before and after any RLS initialization-plan or policy-consolidation migration.

**Performance hardening status (2026-08-26):** production migrations `core_secure_v3_fk_indexes` and `remaining_secure_v3_fk_indexes` are recorded in the migration ledger. Together they add narrow covering indexes for all **24** foreign-key paths that the Supabase advisor previously reported as unindexed. A fresh performance-advisor run reports **0 `unindexed_foreign_keys` warnings**. The private admin-helper rewrite also removed the targeted admin-policy initialization-plan findings; remaining performance findings are on other `auth_rls_initplan` predicates and legacy/multiple-permissive policy families plus expected prelaunch `unused_index` informational results. Newly created indexes are expected to appear unused before representative traffic and should not be removed on that basis. Future RLS-performance work must preserve authorization semantics and be verified against the now-recorded equivalence baseline before production application.

## 5. Billing and entitlement acceptance

- [ ] Confirm approved public plan names, prices, trial length, household limits, cancellation language, and refund policy.
- [ ] Confirm Stripe test-mode product/price IDs match the approved plans.
- [ ] Run same-origin test-mode checkout from an authorized parent/billing owner.
- [ ] Verify cross-origin checkout requests are rejected.
- [ ] Verify checkout confirmation is server-side and ownership-bound.
- [ ] Verify duplicate checkout/subscription creation is prevented.
- [ ] Verify Stripe webhook signature validation and duplicate-event idempotency.
- [ ] Verify entitlement changes only from trusted billing state.
- [ ] Verify Individual plan cannot cover an over-limit household and Family plan respects the household limit.
- [ ] Verify billing portal opens only for the authorized purchaser.
- [ ] Verify cancellation, trial-end, active, past-due, failed-payment, and cancelled states render correctly.
- [ ] Verify test and live Stripe configurations cannot be mixed.
- [ ] Complete final test-mode billing regression before requesting live-payments approval.

**Owner approval required before activation:** live Stripe mode, public billing, or changes to public pricing/terms.

## 6. Privacy, youth, retention, and deletion readiness

- [x] Authenticated privacy-request queue is live.
- [x] Marketing-event storage is separated from learner-performance data and unavailable to browsers.
- [x] Under-13 direct student signup is technically blocked in favor of parent-authorized account creation.
- [ ] Review/finalize Privacy Policy against actual production data flows.
- [ ] Review/finalize Terms of Service and subscription/cancellation disclosures.
- [ ] Review/finalize parental consent flow and consent-version recordkeeping for intended youth use.
- [ ] Approve data-retention schedule.
- [ ] Implement and test operational account/data deletion procedure, including uploaded reports and billing dependencies.
- [ ] Test access, correction, deletion, and account-closure privacy-request handling.
- [ ] Confirm storage-bucket privacy and deletion behavior for prior-assessment uploads.
- [ ] Confirm vendor/subprocessor register is accurate for launch.
- [ ] Confirm security/privacy incident escalation contacts and procedure.

**Owner/legal review dependency:** final legal-policy publication and youth/privacy legal determinations require explicit approval.

## 7. Accessibility, browser, and device acceptance

- [x] Automated accessibility validation is part of every production build.
- [x] Keyboard focus, skip-link, reduced-motion, contrast-preference, and baseline touch-target safeguards are committed.
- [ ] Manually test primary public, parent, student, diagnostic, practice, billing-preview, and admin flows with keyboard only.
- [ ] Verify visible focus order and modal/overlay focus behavior.
- [ ] Verify mobile layout on representative iPhone/Android viewport sizes.
- [ ] Verify tablet/iPad layout.
- [ ] Verify current Chrome, Safari, Edge, and Firefox behavior for critical flows.
- [ ] Verify screen-reader labels/announcements on authentication, diagnostic answer controls, SPR inputs, errors, and modal dialogs.
- [ ] Resolve all launch-blocking accessibility defects found during acceptance.

## 8. Support and operational readiness

- [ ] Confirm real support email/contact route displayed to users.
- [ ] Assign ownership for access, billing, content, privacy, and technical support queues.
- [ ] Prepare standard responses for password/access, billing/cancellation/refund, report parsing, and content-error issues.
- [ ] Document content-error reporting and rapid item retirement process.
- [ ] Document account access/reset escalation.
- [ ] Document billing/refund escalation.
- [ ] Document security/privacy incident escalation separately from ordinary support.
- [ ] Confirm support instructions never request passwords or full payment-card details.
- [ ] Perform at least one synthetic support/privacy incident drill before launch.

## 9. Monitoring, recovery, and release operations

- [ ] Confirm production error monitoring for API 5xx and front-end fatal errors.
- [ ] Confirm authentication failure/spike monitoring.
- [ ] Confirm diagnostic start/completion and practice failure visibility.
- [ ] Confirm database/storage error visibility.
- [ ] Confirm Stripe webhook failure visibility before live billing.
- [ ] Document severity levels and escalation path for SEV-1 through SEV-4 incidents.
- [ ] Document database backup/PITR capability for the actual Supabase plan.
- [ ] Document and test a reasonable restore/recovery procedure using non-destructive/synthetic methods.
- [ ] Record the final launch-candidate commit SHA and production migration state.
- [ ] Run full production build validation on the frozen candidate.
- [ ] Review production runtime errors/logs immediately before launch approval.

## 10. Public website and trust readiness

- [x] Required College Board independence disclosure is a machine-enforced homepage control.
- [x] Public indexing remains disabled until final approval.
- [ ] Verify final public pricing/FAQ/How It Works/Content Quality copy exactly matches launch behavior.
- [ ] Verify Privacy, Terms, support/contact, accessibility, and account/privacy-request routes are accessible from the public product.
- [ ] Verify canonical URLs, sitemap, robots behavior, 404 behavior, titles, descriptions, H1s, and structured data for the final candidate.
- [ ] Verify no unsubstantiated score guarantees, fabricated testimonials, rankings, or outcome claims appear anywhere public.
- [ ] Verify no live diagnostic item is reused as a public worked example or marketing asset.

# OWNER / MANUAL ACTIVATION ITEMS

These remain disabled until the blocking checklist is green and the user explicitly authorizes launch activation.

- [ ] Owner approves final launch candidate.
- [ ] Owner approves final public pricing/trial/refund/cancellation terms.
- [ ] Owner approves final Privacy Policy and Terms publication.
- [ ] Enable Supabase leaked-password protection in Auth settings if not exposed through automation tooling.
- [ ] Switch approved Stripe configuration to live mode.
- [ ] Set public billing/live-payment launch gates to enabled.
- [ ] Remove prelaunch `noindex` protection and enable public indexing.
- [ ] Enable first-party measurement only after privacy approval and measurement acceptance.
- [ ] Enable outbound marketing only after the product is commercially live and support/measurement systems are ready.

# IMPORTANT BEFORE / IMMEDIATELY AFTER LAUNCH

- [ ] Establish first-party marketing measurement baseline before scaling acquisition.
- [ ] Exclude internal/test traffic from acquisition reporting.
- [ ] Lock activation/conversion definitions before campaign reporting.
- [ ] Confirm item-calibration reporting works once sufficient real response volume exists.
- [x] Add covering indexes for all foreign keys reported as unindexed by the production Supabase advisor without altering authorization semantics; **24/24 covered and 0 `unindexed_foreign_keys` findings remain as of 2026-08-26**.
- [ ] Address `auth_rls_initplan` and `multiple_permissive_policies` performance warnings only through authorization-preserving changes with policy-equivalence verification.
- [ ] Establish dependency update cadence.
- [ ] Prepare first-72-hours launch monitoring cadence and rollback decision rules.

# POST-LAUNCH OPERATING CHECKLIST

- [ ] Monitor authentication, onboarding, diagnostic, practice, parent reporting, and payment funnels closely for the first 72 hours.
- [ ] Review support tickets for recurring failure patterns.
- [ ] Retire questionable content rapidly rather than leaving disputed items active.
- [ ] Do not scale paid acquisition until activation, billing reliability, and support capacity are demonstrated.
- [ ] Review content calibration only at meaningful sample sizes.
- [ ] Run weekly commercial operating review covering uptime/errors, funnel conversion, retention, content QA, parent engagement, billing, support, privacy/security incidents, and acquisition efficiency.
- [ ] Reassess newly created index usage only after representative production traffic; prelaunch `unused_index` informational lints are not sufficient reason to remove required FK indexes.
- [ ] Revisit Supabase Auth database connection allocation strategy if instance scaling makes the current absolute connection allocation a constraint.

# Current safest autonomous work order

1. Continue only narrow RLS initialization-plan optimizations on remaining simple self/parent predicates in small batches and re-run the recorded parent/student/admin authorization-equivalence baseline before and after each production change; do not consolidate permissive policies until equivalence is proven separately.
2. Confirm storage-bucket privacy and deletion behavior for prior-assessment uploads and harden the service path if needed without weakening browser access.
3. Continue expanding the fresh private commercial authoring inventory by filling difficulty-2, difficulty-3, and remaining per-skill depth gaps without approving or activating it.
4. Harden account, parent, admin, privacy, and billing-preview authorization boundaries and regression guards.
5. Improve monitoring/recovery/support readiness documentation and testable operational controls.
6. Exercise Stripe test-mode and preview-safe billing paths where credentials/configuration already permit it.
7. Prepare secure-v3 browser/fault-injection acceptance data prerequisites so refresh/new-tab/new-device/network recovery can be tested immediately after reviewed content is imported.
8. Keep the final trusted-learning-authority lock staged until secure-v3 acceptance passes with reviewed content.

# Hard stop rules for autonomous work

- Do not enable live payments or incur new spending.
- Do not enable public billing, indexing, marketing measurement, outbound marketing, public social publishing, or external campaigns.
- Do not production-approve or activate content without the required independent human review.
- Do not weaken authentication, RLS, origin validation, content secrecy, rate limits, or age/parent authorization controls to make a test pass.
- Do not change public pricing, legal policies, or consent representations without owner approval.
- Do not restore/replace a different Supabase project; production is `ataaiocpbjavmdpgmzlv`.