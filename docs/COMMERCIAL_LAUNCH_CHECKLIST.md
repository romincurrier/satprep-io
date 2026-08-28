# SATprep.io Commercial Launch Readiness Checklist

Updated: 2026-08-28

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
- [x] All 24 foreign-key paths flagged by the production Supabase performance advisor are covered by narrow indexes; a fresh advisor run reports **0 `unindexed_foreign_keys` findings**.
- [x] Parent invitation acceptance is atomic and service-role-only.
- [x] Secure-v3 diagnostic answer submission is atomic and service-role-only.
- [x] Secure-v3 diagnostic finalization is atomic and service-role-only.
- [x] Production enforces at most one `in_progress` diagnostic attempt per learner.
- [x] A production parent/student/admin RLS authorization-equivalence baseline is captured in `docs/RLS_AUTHORIZATION_EQUIVALENCE.md` and is required before and after RLS performance rewrites.
- [x] The profile-backed administrator RLS helper is no longer exposed as a public SECURITY DEFINER RPC; all 19 dependent policies use a pinned-search-path helper in the non-Data-API `private` schema.
- [x] Prior-assessment reports use a private Storage bucket, immutable uploader/student-scoped object identity, and a server-mediated deletion path.
- [x] All six `prior_assessments` student/parent `auth_rls_initplan` findings are resolved in production without changing policy commands, roles, or authorization predicates; the recorded parent/student/admin/cross-account baseline remained unchanged before and after.
- [x] All three `privacy_requests` `auth_rls_initplan` findings are resolved in production without changing policy commands, role targets, target-student authorization, or permissiveness; rollback-only parent/unrelated/admin equivalence checks remained unchanged before and after.
- [x] The single `parent_setup_requests` administrator-read `auth_rls_initplan` finding is resolved in production without changing its SELECT command, default PUBLIC role target, permissiveness, profile-backed administrator predicate, or separate public insert policy.
- [x] The `parent_students` household-link INSERT InitPlan finding is resolved without changing its INSERT command, default PUBLIC target, permissiveness, self-parent requirement, parent role, or same-household learner scope; existing read/admin policies were untouched.
- [x] Both `students` parent-household write InitPlan findings are resolved without changing INSERT/UPDATE commands, default PUBLIC targets, permissiveness, parent role, non-null household requirement, or same-household scope; read/self/admin policies were untouched.
- [x] The remaining legacy `admin_students_all` InitPlan finding is resolved without changing its ALL command, default PUBLIC target, permissiveness, or profile-backed administrator predicate in USING/WITH CHECK; the private-helper admin policy and all parent/student policies were untouched.
- [x] Administrator-only `test_runs`/`test_events` RLS is InitPlan-safe in production with the exact profile-backed admin authorization predicate preserved in USING and WITH CHECK.
- [x] Subscription self-read and household billing-owner read RLS is InitPlan-safe in production without changing the separate administrator policy or subscription visibility semantics.
- [x] Private content review tooling preserves spreadsheet display values so reviewed fractions, percentages, currency, and similar formatted answer text are not silently replaced by numeric/date serials during readiness or import.
- [x] Prelaunch MutationObserver rewrites are idempotent, and production build validation rejects the unconditional observed-text rewrite pattern that caused the 2026-08-27 homepage render loop.

# BLOCKING BEFORE COMMERCIAL LAUNCH

## 1. Commercial content bank

**Staging progress (2026-08-26):** the private Google Drive staging bank contains **94 assistant-staged, unapproved drafts: 47 diagnostic and 47 practice items**. All rows remain `production_approved=FALSE`. A fresh production query confirms `public.content_items` still contains **0 rows, 0 active items, and 0 items with `qa_status='production_approved'`**. Independent human review remains mandatory before any production import, approval, or activation.

**Staging serialization integrity (2026-08-26):** a source-value audit found that Google Sheets had auto-coerced 12 fraction-like MCQ choice cells in three unapproved Math drafts into date serials while displaying the intended fraction text. Those cells were normalized to literal TEXT values and re-read from the sheet to confirm string storage. The private readiness/import scripts now parse spreadsheet display values (`raw:false`) and the production build validates that requirement, preventing reviewed fractions, percentages, currency, and similar formatted content from being silently changed by spreadsheet serialization. No item was approved, imported, or activated as part of this repair.

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
- [x] Verify atomic/idempotent diagnostic finalization at the trusted database boundary.
- [ ] Verify full browser/API secure-v3 diagnostic completion updates the learning model exactly once with independently reviewed content.
- [ ] Verify recommended learning path reflects prior evidence plus diagnostic evidence in full secure-v3 acceptance.
- [ ] Verify guided practice uses the secure server-scored bank and cannot fall back to browser scoring in commercial mode.
- [ ] Verify MCQ and Math SPR practice scoring.
- [ ] Verify every practice response returns appropriate instructional feedback only after scoring.
- [ ] Verify practice completion updates mastery/lesson progress exactly once.
- [ ] Verify parent progress accurately reflects trusted server-scored learning state.
- [ ] Verify administrator overview remains role-restricted and presentation-minimized.

**Trusted-diagnostic status (2026-08-26):** production includes atomic parent-invitation acceptance, atomic secure-v3 diagnostic response submission, single-active-attempt resume protection, and atomic diagnostic finalization. These trusted RPC paths are service-role-only where appropriate, row-lock state before mutation, reject forged/out-of-sequence changes, preserve idempotency, and are protected by production-build regression validators. Full browser completion/resume/fault-injection acceptance remains open until independently reviewed secure-v3 content is available.

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
- [x] Resolve the six `prior_assessments` student/parent `auth_rls_initplan` findings through InitPlan-only policy rewrites and verify authorization equivalence before and after production application.
- [x] Resolve the three `privacy_requests` `auth_rls_initplan` findings through InitPlan-only policy rewrites and verify privacy-request authorization equivalence before and after production application.
- [x] Resolve the `admin_parent_setup_request_read` `auth_rls_initplan` finding without changing the public insert policy or administrator/non-administrator authorization semantics.
- [x] Resolve the `parent_link_household_student_insert` InitPlan finding without changing the parent/student-link authorization model or adjacent policies.
- [x] Resolve the `parent_household_student_insert` and `parent_household_student_update` InitPlan findings without changing parent-household authorization semantics or adjacent student policies.
- [x] Resolve the legacy `admin_students_all` InitPlan finding without changing administrator authorization semantics or consolidating the separate permissive policies.
- [x] Resolve the `admin_test_runs_all` and `admin_test_events_all` InitPlan findings without changing PERMISSIVE/PUBLIC/ALL policy shape or the exact profile-backed administrator predicate.
- [x] Resolve `subscription_self_read` and `subscription_household_billing_owner_read` InitPlan findings without changing reader authorization semantics or the separate administrator policy.
- [ ] Run the final release-candidate Supabase security-advisor review after remaining launch migrations/configuration are frozen.
- [ ] Run a release-candidate dependency/security review.
- [ ] Verify production security headers on the final public candidate.
- [ ] Complete basic abuse testing on signup, invitations, diagnostic/practice submission, privacy requests, and billing endpoints.

**Current advisor status (2026-08-28):** a fresh production security-advisor review reports no executable SECURITY DEFINER warning. The only remaining actionable security warning is that leaked-password protection is disabled; service-only RLS-with-no-policy findings remain informational and fail-closed by design. Enabling leaked-password protection remains an owner/manual activation item because the current automation tooling does not expose the required Auth setting.

**Authorization-equivalence status (2026-08-28):** the reusable parent/student/admin baseline remains recorded in `docs/RLS_AUTHORIZATION_EQUIVALENCE.md`. For the `prior_assessments` tranche, parent access remained limited to the linked learner/report, unrelated learner/report access remained zero, student access remained self-only, and the administrator retained the intended operational view. For the `privacy_requests` tranche, rollback-only production tests before and after the rewrite confirmed that a parent could create/read a request targeting the linked learner, an unrelated authenticated profile could not read that request, and an administrator could read it. The test row was rolled back each time; production `privacy_requests` remains empty. For `parent_setup_requests`, the table was empty, so authorization equivalence was captured by evaluating the exact profile-backed read predicate before and after: it remained true for the administrator profile and false for parent/student profiles, while the SELECT policy stayed PERMISSIVE with the default PUBLIC target and the separate public INSERT policy remained unchanged. For the `parent_students` INSERT tranche, the linked parent remained authorized only for the same-household learner candidate, the unrelated/unlinked learner remained unauthorized, the student actor remained unauthorized, and the separate administrator path remained intact. For the two parent-household `students` write policies, the linked parent remained authorized for the same household and unauthorized for the unrelated/null-household learner, while student and administrator actors did not gain the parent-household predicate. For legacy `admin_students_all`, the exact profile-backed administrator predicate remained true for the administrator and false for parent/student identities before and after; the policy stayed PERMISSIVE/PUBLIC/ALL with the same predicate in USING and WITH CHECK, and `student_admin_all` plus all parent/self policies were unchanged. For the test telemetry tranche, the exact administrator predicate remained true for the administrator and false for parent/student identities before and after on both `test_runs` and `test_events`. For subscription reads, the parent retained exactly one authorized subscription row through the changed reader predicates, while the tested administrator and student retained zero rows through those predicates; the separate admin policy was untouched.

**Performance hardening status (2026-08-28):** production migrations `core_secure_v3_fk_indexes` and `remaining_secure_v3_fk_indexes` cover all **24** foreign-key paths previously reported as unindexed. Migration `prior_assessments_rls_initplan` is recorded in the production migration ledger and a fresh advisor reports **zero `auth_rls_initplan` findings for `public.prior_assessments`**. Migration `privacy_requests_rls_initplan` is recorded and a fresh advisor reports **zero `auth_rls_initplan` findings for `public.privacy_requests`**. Migration `parent_setup_requests_rls_initplan` is recorded and a fresh advisor reports **zero `auth_rls_initplan` findings for `public.parent_setup_requests`**; the public insert policy was not changed. Migration `parent_students_insert_rls_initplan` is recorded and a fresh advisor reports **zero `auth_rls_initplan` findings for `public.parent_students`**. Migrations `students_parent_household_rls_initplan` and `students_admin_rls_initplan` are recorded; a fresh advisor reports **zero `auth_rls_initplan` findings for `public.students`**. Migrations `test_tables_admin_rls_initplan` and `subscriptions_read_rls_initplan` are now recorded in production and mirrored in the repository; a fresh advisor reports **zero `auth_rls_initplan` findings for `public.test_runs`, `public.test_events`, and `public.subscriptions`**. Existing multiple-permissive warnings were intentionally left unchanged because policy consolidation is outside these authorization-equivalent InitPlan tranches. Other InitPlan warnings remain and must be addressed only in small authorization-equivalent batches. Expected prelaunch `unused_index` informational results are not a reason to remove required indexes.

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
- [x] Confirm storage-bucket privacy and deletion behavior for prior-assessment uploads.
- [ ] Confirm vendor/subprocessor register is accurate for launch.
- [ ] Confirm security/privacy incident escalation contacts and procedure.

**Prior-assessment storage/deletion status (2026-08-26):** production bucket `assessment-reports` is private. Migration `prior_assessment_storage_privacy` is recorded in production and enforces uploader/student path identity plus immutability of report ownership fields. Report deletion is server-mediated, authorization-checked, removes Storage through the Storage API, and then performs service-only transactional metadata/derived-state cleanup. Full account/privacy-request deletion orchestration remains separately **BLOCKING** because it must also cover account and billing dependencies.

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
- [x] The production prelaunch guard has a build-enforced idempotence regression check after the 2026-08-27 self-triggering MutationObserver outage was repaired.
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
- [ ] Address remaining `auth_rls_initplan` and `multiple_permissive_policies` performance warnings only through authorization-preserving changes with policy-equivalence verification; completed InitPlan tranches now include six `prior_assessments`, three `privacy_requests`, one `parent_setup_requests`, one `parent_students`, all three remaining `students` findings, two administrator-only test telemetry policies, and two subscription reader policies.
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

1. Improve monitoring/recovery/support readiness documentation and testable operational controls, including first-72-hours monitoring and explicit rollback criteria.
2. Continue narrow RLS initialization-plan optimization in small authorization-equivalent batches. The next low-blast-radius candidate is the read-only `public.journey_events` parent/student pair; capture parent/student/admin/cross-account behavior before and after, preserve commands/default PUBLIC targets/permissiveness, and do not consolidate existing multiple-permissive policies in the same tranche.
3. Continue expanding the fresh private commercial authoring inventory by filling difficulty-2, difficulty-3, and remaining per-skill depth gaps without approving or activating it.
4. Harden account, parent, admin, privacy, and billing-preview authorization boundaries and regression guards.
5. Exercise Stripe test-mode and preview-safe billing paths where credentials/configuration already permit it.
6. Prepare secure-v3 browser/fault-injection acceptance data prerequisites so refresh/new-tab/new-device/network recovery can be tested immediately after reviewed content is imported.
7. Keep the final trusted-learning-authority lock staged until secure-v3 acceptance passes with reviewed content.

# Hard stop rules for autonomous work

- Do not enable live payments or incur new spending.
- Do not enable public billing, indexing, marketing measurement, outbound marketing, public social publishing, or external campaigns.
- Do not production-approve or activate content without the required independent human review.
- Do not weaken authentication, RLS, origin validation, content secrecy, rate limits, or age/parent authorization controls to make a test pass.
- Do not change public pricing, legal policies, or consent representations without owner approval.
- Do not restore/replace a different Supabase project; production is `ataaiocpbjavmdpgmzlv`.
