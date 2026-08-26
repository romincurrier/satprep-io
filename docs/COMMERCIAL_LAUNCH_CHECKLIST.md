# SATprep.io Commercial Launch Readiness Checklist

Updated: 2026-08-26

This file is the single operating checklist for commercial launch readiness. `docs/COMMERCIAL_LAUNCH_RUNBOOK.md` remains the detailed procedure; this checklist tracks what is actually complete and what still blocks launch.

**Launch-ready definition:** every item in **BLOCKING BEFORE COMMERCIAL LAUNCH** must be complete, all owner/manual activation items must be intentionally approved, and the release-candidate build plus production-equivalent end-to-end regression must be green. Items under **IMPORTANT BEFORE/IMMEDIATELY AFTER LAUNCH** should be completed unless explicitly accepted as a documented launch exception.

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
- [x] Production builds now fail if browser source or built output exposes server-only environment names, privileged Supabase JWTs, or credential-shaped Stripe/OpenAI/GitHub/AWS secrets.
- [x] First production database performance-hardening tranche is applied and reconciled: ten secure-v3/household foreign-key paths now have covering indexes with no RLS, grant, content, or application-authority changes.
- [x] Parent invitation acceptance is now atomic and service-role-only: household/profile/student/link/invitation/consent changes commit in one row-locked database transaction with no new browser grants.

# BLOCKING BEFORE COMMERCIAL LAUNCH

## 1. Commercial content bank

**Staging progress (2026-08-26):** the private Google Drive staging bank now contains **94 assistant-staged, unapproved drafts: 47 diagnostic and 47 practice items**. All **31 official skill keys** represented by the current taxonomy now have at least one diagnostic draft and one practice draft. The newest 62-item expansion added one difficulty-1 diagnostic and one difficulty-1 practice draft for every skill and includes **10 Math SPR items**. This is authoring inventory only: every row remains `production_approved=FALSE`, and live inspection of production project `ataaiocpbjavmdpgmzlv` confirms `public.content_items` currently contains **0 rows, 0 active items, and 0 items with `qa_status='production_approved'`**. The next autonomous authoring passes should fill difficulty-2 and difficulty-3/depth gaps; independent human review remains mandatory before any production import, approval, or activation.

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
- [ ] Verify invitation expiration/reuse behavior.
- [ ] Verify prior-assessment upload flow with supported file types and representative synthetic/redacted reports.
- [ ] Verify a fresh learner starts secure-v3 diagnostic.
- [ ] Verify diagnostic item payload never contains answer keys, explanations, or distractor rationales.
- [ ] Verify diagnostic question order cannot be skipped or forged.
- [ ] Verify duplicate answer submissions are idempotent.
- [ ] Verify refresh, new tab, and new-device resume behavior.
- [ ] Verify temporary network failure does not lose saved answers.
- [ ] Verify diagnostic feedback remains withheld until assessment completion.
- [ ] Verify diagnostic completion updates the learning model exactly once.
- [ ] Verify recommended learning path reflects prior evidence plus diagnostic evidence.
- [ ] Verify guided practice uses the secure server-scored bank and cannot fall back to browser scoring in commercial mode.
- [ ] Verify MCQ and Math SPR practice scoring.
- [ ] Verify every practice response returns appropriate instructional feedback only after scoring.
- [ ] Verify practice completion updates mastery/lesson progress exactly once.
- [ ] Verify parent progress accurately reflects trusted server-scored learning state.
- [ ] Verify administrator overview remains role-restricted and presentation-minimized.

**Invitation hardening status (2026-08-26):** production migration `atomic_parent_invitation_acceptance` is applied. Invitation acceptance now locks the parent, invitation, student, and existing household as applicable and performs household creation/linking, invitation consumption, and the existing consent-record write in one transaction. The RPC is `SECURITY INVOKER`, has a fixed search path, and live privilege checks confirm `anon=FALSE`, `authenticated=FALSE`, `service_role=TRUE` for execution. The application now calls only this trusted RPC for acceptance, and the production build contract checks enforce that architecture. Runtime synthetic expiration/reuse acceptance remains open and must still be tested before launch.

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
- [x] Repository deployment guard now rejects a retired/wrong Supabase CSP endpoint, Supabase wildcard origins, `unsafe-eval`, premature removal of `noindex`, and weakened baseline permissions controls.
- [x] Current worktree and production browser bundle are protected by a build-time secret-boundary validator; the validated Vercel build for commit `fe4f68547b75409af579792a6ef90ab3644a8bc5` passed.
- [ ] Complete a launch-relevant repository-history secret scan and rotate/revoke any credential if historical exposure is found; the current connector can validate the present tree/build but does not certify every historical Git object.
- [ ] Enable Supabase Auth leaked-password protection.
- [ ] Run final security advisor review and document the intentional `is_admin()` SECURITY DEFINER exception or refactor it safely.
- [ ] Run a release-candidate dependency/security review.
- [ ] Verify production security headers on the final public candidate.
- [ ] Complete basic abuse testing on signup, invitations, diagnostic/practice submission, privacy requests, and billing endpoints.

**Current advisor status (2026-08-26):** production remains healthy. A fresh security advisor review after the atomic invitation migration reports the same two actionable warnings as before: leaked-password protection is disabled and authenticated users can execute `public.is_admin()` as a SECURITY DEFINER function. Live inspection confirms anonymous execution is revoked, authenticated execution is used by existing admin RLS policies, and browser profile UPDATE authority is restricted to `first_name` and `last_name`; the `is_admin()` warning therefore remains an intentional-but-not-yet-finally-documented launch exception pending final review. Service-only tables with RLS and no browser policy appear as informational lints and remain fail-closed by design. The new invitation RPC introduced no security-advisor warning and is independently verified as service-role-only.

**Performance hardening status (2026-08-26):** migration `core_secure_v3_fk_indexes` is recorded in the production migration ledger and adds covering indexes for ten high-value secure-v3/household foreign keys: diagnostic attempt items, diagnostic attempts, diagnostic responses (content item and student), practice responses (item and student), practice session items, parent-student links, and profile/student household links. Live `pg_indexes` verification confirms all ten indexes exist. A fresh Supabase performance advisor no longer reports those ten as unindexed foreign keys, reducing the outstanding unindexed-FK findings from **24 to 14**. Remaining RLS initialization-plan and multiple-permissive-policy warnings are intentionally deferred to authorization-equivalent migrations rather than changing policy semantics casually. The new indexes appear as unused in the prelaunch zero-traffic advisor, which is expected and is not a basis for removing them before representative production use.

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

These should remain disabled until the blocking checklist is green and the user explicitly authorizes launch activation.

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
- [x] Add covering indexes for the first ten highest-value secure-v3/household foreign-key paths without altering authorization semantics; production migration and advisor reconciliation completed 2026-08-26.
- [ ] Continue the remaining 14 unindexed-foreign-key findings and RLS performance warnings only through authorization-preserving changes with equivalent-policy verification.
- [ ] Establish dependency update cadence.
- [ ] Prepare first-72-hours launch monitoring cadence and rollback decision rules.

# POST-LAUNCH OPERATING CHECKLIST

- [ ] Monitor authentication, onboarding, diagnostic, practice, parent reporting, and payment funnels closely for the first 72 hours.
- [ ] Review support tickets for recurring failure patterns.
- [ ] Retire questionable content rapidly rather than leaving disputed items active.
- [ ] Do not scale paid acquisition until activation, billing reliability, and support capacity are demonstrated.
- [ ] Review content calibration only at meaningful sample sizes.
- [ ] Run weekly commercial operating review covering uptime/errors, funnel conversion, retention, content QA, parent engagement, billing, support, privacy/security incidents, and acquisition efficiency.

# Current safest autonomous work order

1. Continue expanding the fresh private commercial authoring inventory by filling difficulty-2, difficulty-3, and remaining per-skill depth gaps without approving or activating it.
2. Add/strengthen automated acceptance checks that do not require reviewed proprietary content.
3. Continue the remaining 14 missing foreign-key indexes and only then address RLS initialization-plan/multiple-policy performance warnings with authorization-equivalent verification.
4. Harden account, parent, admin, privacy, and billing-preview authorization boundaries and regression guards.
5. Improve monitoring/recovery/support readiness documentation and testable operational controls.
6. Exercise Stripe test-mode and preview-safe billing paths where credentials/configuration already permit it.
7. Prepare secure-v3 end-to-end test harness/data prerequisites so reviewed content can be tested immediately after import.
8. Keep the final trusted-learning-authority lock staged until secure-v3 acceptance passes with reviewed content.

# Hard stop rules for autonomous work

- Do not enable live payments or incur new spending.
- Do not enable public billing, indexing, marketing measurement, outbound marketing, public social publishing, or external campaigns.
- Do not production-approve or activate content without the required independent human review.
- Do not weaken authentication, RLS, origin validation, content secrecy, rate limits, or age/parent authorization controls to make a test pass.
- Do not change public pricing, legal policies, or consent representations without owner approval.
- Do not restore/replace a different Supabase project; production is `ataaiocpbjavmdpgmzlv`.
