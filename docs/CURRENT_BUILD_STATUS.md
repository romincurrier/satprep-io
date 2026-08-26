# SATprep.io Current Build Status

Updated: 2026-08-25

## Current state
SATprep.io remains a pre-launch commercial candidate. Public indexing, live payments, first-party measurement, paid media, outbound email, public social publishing, and external campaign activation remain disabled behind explicit launch gates. College Board trademark review is not a launch blocker; the public homepage must retain the required independence disclosure that SATprep.io is not sponsored by, endorsed by, or associated with College Board.

## Completed / committed
- Secure server-scored diagnostic and guided-practice architecture is committed, including MCQ and Math SPR handling, durable resume, idempotent response handling, adaptive practice bands, practice rotation, and exact-hash content approval checks.
- Commercial content policy requires at least 6 approved diagnostic items and 8 approved practice items per skill with required difficulty coverage before launch readiness can be claimed.
- Proprietary-content import rejects duplicate and very-high-similarity items, including cross-use between diagnostic and practice banks.
- Commercial review independence is technically enforced in the private import path: each item requires at least three distinct reviewer labels across accuracy, alignment, editorial, bias/accessibility, and originality, and no reviewer may approve more than two dimensions on the same item. The strict live-content verifier independently checks the same reviewer-diversity rule before launch readiness can pass.
- A metadata-only private content readiness preflight reports per-exam/per-skill diagnostic and practice depth, difficulty distribution, Math SPR counts, excluded rows, and shortfalls without printing proprietary question text or requiring the content file to enter the public repository.
- Sensitive diagnostic/practice answer material remains server-only; candidate-scoped reads avoid full proprietary-store scans.
- The homepage independence disclosure is implemented as a dedicated module and enforced by the production launch validator so a later homepage redesign cannot silently remove it.
- Production Supabase now contains the service-only rate limiter, commercial content tables, secure practice-session/response tables, Math SPR response support, privacy-request queue, privacy-minimized marketing-event table, and content-calibration views.
- Direct grants were verified live: anonymous and ordinary authenticated browser roles cannot select from or insert into the proprietary content, answer-key, diagnostic-plan, secure-practice, rate-limit, or marketing-event tables.
- The direct student-signup age gate is live and preserves the established parent-signup behavior: parent accounts still create a household and become its billing owner, while direct under-13 student signup is rejected unless the account was created through the trusted parent-authorized admin path.
- Browser profile mutation authority is restricted to first/last name; role, household, billing authority, identity, DOB/consent-linked fields, and other authority-bearing profile fields are server-controlled.
- The legacy anonymous `email_registered` membership oracle is no longer loaded by the public client and the database function is service-role-only, preventing public account/email enumeration.
- Parent reporting is server mediated end to end. Household/student presentation metadata is loaded through `/api/parent-household-overview`; learning summaries are loaded through `/api/parent-progress`. Both require same-application origin, parent authentication/household scope, and durable rate limiting. The parent UI no longer directly reads `profiles`, `students`, `question_attempts`, `skill_mastery`, or `lesson_progress` for the commercial dashboard.
- Administrator operations are server mediated through `/api/admin-overview`; broad operational-table reads were removed from the browser, the API requires the administrator role and rate limiting, and the client receives only the presentation data needed for the operations dashboard.
- Billing mutation endpoints enforce a shared browser-origin guard before authenticated billing context is loaded. Public-host requests fail closed without `Origin`, cross-site `Sec-Fetch-Site` requests are rejected, the Origin hostname must match the request host, and non-localhost browser billing traffic must use HTTPS. Checkout creation, checkout confirmation, billing-portal creation, and billing-state reads all use the same guard.
- A separate shared application-origin guard protects privileged account and trusted-learning mutations outside billing. It fails closed on the public hosts when `Origin` is missing, rejects cross-site `Sec-Fetch-Site`, requires HTTPS except localhost, and requires the browser Origin hostname to match the actual request host.
- API responses vary on both `Authorization` and `Origin`. Build validation fails if the shared origin contract, sensitive mutation coverage, trusted-learning guard ordering, account-enumeration boundary, parent reporting boundary, or launch disclosure regresses.
- Billing account state is server mediated through `/api/billing-overview`. The browser no longer directly reads `profiles`, `subscriptions`, or `students` for the billing screen and no longer receives Stripe customer/subscription identifiers; it receives only role/billing-owner state, student count, presentation-safe subscription fields, and a boolean `can_manage` flag.
- Billing controls and checkout-return handling are parent-only in the browser, matching the server-side rule that only the household parent/guardian billing owner may create or manage a subscription.

## Live backend status
The intended production backend is Supabase project `ataaiocpbjavmdpgmzlv`, and management access was successfully reconciled against that exact project on 2026-08-25. The following commercial-readiness migrations are now verified live: `api_rate_limits`, `profile_privilege_lock`, `content_system`, `practice_sessions`, `spr_responses`, corrected `student_signup_age_gate`, `privacy_requests`, `marketing_measurement`, `marketing_events_privilege_lock`, `content_calibration`, and `disable_email_enumeration`.

The staged `trusted_learning_authority` migration is intentionally **not yet applied**. The production commercial content bank currently has no activated independently reviewed launch inventory, so removing all legacy browser learning-write authority before secure-v3 content activation could strand prelaunch/legacy flows. Apply that final authority lock only after fresh reviewed content is imported and the secure diagnostic/practice journey passes end-to-end production-equivalent testing.

Supabase security advice currently has one intentional application-function warning: `public.is_admin()` remains `SECURITY DEFINER` and executable by authenticated users because numerous existing RLS policies depend on it. It should not be revoked merely to silence the advisor without first refactoring those policies. Supabase leaked-password protection remains disabled and should be enabled in Auth settings before commercial launch.

## Immediate next actions
1. Continue authoring and independently reviewing fresh private commercial content toward the 6-diagnostic / 8-practice per-skill policy, using the private readiness preflight to target exact skill/difficulty gaps and Math SPR representation.
2. Import reviewed content inactive first; run exact-hash/reviewer-diversity checks and production-equivalent runtime QA before activation.
3. Run full end-to-end parent → student → prior assessment → diagnostic → learning path → guided practice → mastery → parent reporting regression with fresh test accounts using the secure-v3 bank.
4. After secure-v3 regression passes, apply and verify `trusted_learning_authority` to retire browser mutation authority over mastery, lesson completion, and legacy question-attempt writes.
5. Enable Supabase Auth leaked-password protection and re-run security advisors.
6. Exercise billing preview on a non-public host with Stripe test mode, including same-origin success, cross-origin rejection, checkout ownership verification, duplicate-subscription prevention, server-mediated billing-state rendering, and portal ownership checks.
7. Perform final accessibility/browser/device acceptance testing and operational support/privacy-request drills.
8. Keep public indexing, live billing/payments, measurement, advertising, outreach, and external publishing disabled until the remaining content, acceptance, and commercial gates are explicitly cleared.
