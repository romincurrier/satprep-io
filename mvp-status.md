# SATprep.io MVP / Commercial-Launch Completion Standard

SATprep.io is considered launch-ready only when it is a testable end-to-end learning product, not a mockup, and the content, privacy, security, billing, and marketing claims are supportable.

## Core user journey
- Public marketing homepage with clear trial/signup and sign-in paths.
- Parent registration, email verification, household creation, and duplicate-email handling.
- Age-aware student signup; under-13 self-registration stops before child identity/profile collection and routes to parent/guardian setup.
- Stripe sandbox supports the planned Individual and Family subscription options and trial flow; live billing remains an explicit launch approval gate.
- Subscription state persists in Supabase and parent billing can be managed through the Stripe Billing Portal.
- Parent can activate an existing child's student login without creating a duplicate learner record.
- Student can sign in independently when the account/household workflow allows it.
- Student completes learner profile and can optionally add supported prior testing evidence.
- Student completes a secure, resumable 20-item initial diagnostic aligned to the current SAT Suite skill taxonomy. The diagnostic is assessment-only: no correct/incorrect feedback or explanations during testing.
- Secure diagnostic delivery sends only the current unanswered prompt/choices; scoring occurs server-side and the real answer key is not returned to the browser.
- Student receives a skill-level learning path informed by prior assessment evidence, diagnostic results, and ongoing performance.
- Learning/practice sessions teach the process and provide correct/incorrect feedback, the correct answer, and an explanation after each response.
- Skill mastery and learning progress persist across sessions.
- Progress Roadmap / Road to Test Day displays stage, milestones, achievements, and next recommended work without competing with the academic learning plan.
- Parent dashboard reports student setup, diagnostic status, progress, skill evidence/mastery, and useful next-step visibility.
- Mobile and desktop experiences remain usable and clear.

## Product quality gates
- No dead ends in registration, onboarding, billing, student activation, prior-score upload, diagnostic/resume, learning, progress, or account management.
- Every important write has a clear success/error/retry state.
- Errors are user-readable and do not expose secrets, answer keys, or stack traces.
- Existing child/student records are never duplicated during login activation.
- A diagnostic can be safely closed, reopened in a new tab/window/device session, and resumed at the next unanswered item.
- Diagnostic answers are immutable after submission; duplicate network retries are idempotent.
- Question sequencing cannot be skipped to scrape future diagnostic items.
- Subscription entitlement is checked server-side for privileged household actions.
- Parent/student/admin permissions are enforced server-side or with database RLS, not only hidden in UI.

## Content launch gate
- Diagnostic and practice content is SATprep.io-original and mapped to the current official SAT Suite domains/skills.
- Automated validation passes for taxonomy, answer keys, explanations, duplicate IDs, diagnostic blueprints, exam eligibility, required skill coverage, and diagnostic/practice overlap.
- The shared commercial content policy requires at least **6 hash-valid approved diagnostic items per skill** and **8 hash-valid approved practice items per skill** before full launch readiness can be claimed.
- Approved diagnostic inventory for a skill must span difficulty levels 1, 2, and 3. Approved practice inventory must include at least 2 difficulty-1, 3 difficulty-2, and 2 difficulty-3 items, with at least 8 approved items total for rotation depth.
- Five-item guided-practice sessions remain intentionally shorter than the eight-item per-skill inventory requirement; the extra approved depth exists for rotation, repeat-session freshness, and adaptive selection.
- New commercial practice sessions fail closed unless the requested skill meets the shared approved depth/difficulty policy. Saved sessions may resume only while every persisted item remains currently approved and hash-valid.
- Math guided practice targets approximately 25% student-produced response items when the approved pool supports that mix; Reading and Writing remains multiple choice.
- Independent review covers accuracy, SAT/PSAT alignment, editorial quality, bias/accessibility, and originality.
- Review decisions are bound to the exact reviewed question using a content hash; editing an item invalidates the old approval.
- Only reviewed/approved content is eligible for commercial production sessions.
- The secure commercial diagnostic bank must be fresh content created after a private proprietary-content boundary is established; historical public-repository diagnostic items are not promoted into the secure bank merely by adding approvals later.
- Internal mastery/readiness signals are not marketed as official SAT/PSAT scaled scores unless a separate calibration study supports that claim.
- No score-increase, admission, scholarship, or comparative-superiority claims are published without adequate documented evidence.

## Security launch gate
- RLS/policies reviewed for every table and storage resource containing parent/student data.
- Cross-household isolation verified for parent and student accounts.
- Student cannot elevate role or access parent billing/admin/sibling data.
- Parent cannot access unrelated students or households.
- Admin authorization and any SECURITY DEFINER functions reviewed.
- Account-enumeration surfaces minimized.
- Auth protections, password protections, and email verification configuration reviewed.
- API authorization, abuse/rate controls, origin assumptions, session handling, input validation, and idempotency tested.
- Service-role key remains server-only and cannot be bundled into public JavaScript.
- Secure diagnostic answer keys/explanations cannot be retrieved from browser source, item APIs, or browser-authorized database queries.
- Stripe secret/webhook verification, replay/idempotency, sandbox/live separation, refunds/cancellation, and entitlement behavior verified.
- Global HTTP security headers and API no-store/security headers remain enabled.
- Supabase security/performance advisors are rerun after final migrations with no unresolved critical findings.
- Final production smoke tests are completed before public registration is enabled.

## Privacy / minors launch gate
- Formal data inventory and processor register are completed.
- Under-13 parental notice/consent design is reviewed against COPPA and applicable state-law obligations.
- Parent review/delete/control rights and account-deletion workflow are implemented and tested where required.
- Written retention schedule exists for uploaded reports, extracted learning evidence, diagnostic/practice data, account records, billing records, logs, and backups.
- Student learning/score/upload data is not used for behavioral advertising or third-party ad audiences.
- Marketing analytics is separated from learner data and collects only privacy-reviewed, necessary fields.
- Final Privacy Policy, terms, subscription/cancellation terms, and any child/privacy disclosures match the actual production data flow and receive qualified legal review.

## SEO / marketing readiness gate
- Indexable product and educational pages have unique titles/descriptions, canonical URLs, appropriate structured data, internal links, and accurate non-affiliation language.
- XML sitemap/robots are valid; unknown routes return a real 404 rather than a soft-404 copy of the app.
- Build validates content, SEO, security, adaptive practice, the shared commercial content policy, and launch-state invariants before deployment.
- Methodology and content-quality standards are public and accurately describe current behavior.
- Search Console, analytics, email, ad, social, affiliate, and partnership accounts are connected only after explicit approval.
- Campaign attribution avoids names, emails, DOB/age, school data, uploaded score data, diagnostic answers, or skill mastery.
- Paid campaigns optimize toward meaningful activation/retention rather than clicks or raw account creation once sufficient lawful measurement exists.

## Current focus
1. Reconcile the committed Supabase migrations against the live `ataaiocpbjavmdpgmzlv` project when management connectivity is available; apply only missing migrations, then rerun security/performance advisors and the read-only backend contract verifier.
2. Establish the private proprietary-content boundary and build the fresh secure diagnostic bank toward 6 fully approved items per official skill, with reviewed difficulty coverage and Math SPR representation where appropriate.
3. Expand independently reviewed practice inventory toward 8 approved items per skill. Runtime now refuses to open a new commercial practice session below that rotation/depth threshold and targets Math SPR in the selected instructional mix when available.
4. Verify secure diagnostic v3 and guided practice end-to-end with fresh test accounts, including multi-window/device resume, duplicate-network retries, revoked approvals, session immutability, and server-scored MCQ/SPR behavior.
5. Complete end-to-end regression across parent, student, admin, onboarding, billing, assessment upload, diagnostic, learning, progress, privacy requests, and support recovery.
6. Complete privacy/minors data inventory, retention/deletion design, processor review, and qualified legal review.
7. Continue SEO content clusters/internal linking and launch measurement design without activating indexing, unreviewed tracking, paid media, outbound email, or public social/affiliate execution.
