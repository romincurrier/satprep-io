# SATprep.io Commercial Launch Runbook

Status: pre-launch operating runbook. This document does not authorize live payments, public advertising, outbound email, or publication of final legal policies.

## Purpose
A commercially viable SATprep.io release requires more than a green application build. Launch requires a reviewed content bank, secure production data system, resilient student/parent flows, billing controls, privacy/legal readiness, support operations, monitoring, and measured acquisition.

## Launch authority
The following require explicit owner approval before activation:
- restoring/starting infrastructure when it changes billing;
- live Stripe mode;
- public pricing changes;
- final Privacy Policy/Terms publication;
- paid media spend;
- outbound marketing email;
- social/partner/affiliate account creation or activation;
- public press/outreach;
- use of real student testimonials, outcomes, or screenshots.

## 1. Content release gate
Required before public customers rely on SATprep.io recommendations:
- [ ] Current digital SAT Suite taxonomy reverified against official College Board public specifications.
- [ ] Diagnostic bank structural validation green.
- [ ] Practice bank structural validation green.
- [ ] No exact diagnostic/practice duplicates in active pools.
- [ ] Independent content review completed for every release item.
- [ ] Human approvals applied through `content-approval-registry.json`.
- [ ] `npm run validate:approvals` passes with no stale hashes.
- [ ] `npm run content:readiness -- --strict` meets the launch-depth threshold.
- [ ] Diagnostic explanations remain server/internal only during assessment.
- [ ] Practice explanations are reviewed for correctness and reusable teaching value.
- [ ] Any public worked examples come only from content explicitly approved for public instruction, not live diagnostic items.

Release evidence to retain:
- source commit SHA;
- independent review export and completed review artifact;
- review validation output;
- approval registry commit;
- content-readiness output;
- reviewer names/labels and dates under the final internal recordkeeping policy.

## 2. Production database gate
- [ ] Supabase project intentionally active.
- [ ] Production project identity verified before migrations.
- [ ] Schema/migration list reconciled with repository.
- [ ] Pending migrations applied in order.
- [ ] RLS enabled on every learner/family/content table that requires it.
- [ ] Supabase security advisors reviewed after migrations.
- [ ] Supabase performance advisors reviewed after migrations.
- [ ] Secure-v3 diagnostic responses confirmed inaccessible directly from authenticated browser clients.
- [ ] Service-role key exists only in server environment.
- [ ] Publishable/anon key is the only Supabase key shipped to browser code.
- [ ] Database backup/PITR capability and restore procedure documented for the actual production plan.
- [ ] Data-retention/deletion process defined before collecting public learner data.

Current blocker note: the connected Supabase project was observed as `INACTIVE` on 2026-08-24. Do not treat database-dependent E2E testing as complete until the project is intentionally active and verified.

## 3. Authentication and account gate
Student flow:
- [ ] Signup works.
- [ ] Email verification behavior is intentional and tested.
- [ ] Student profile is created once, not duplicated.
- [ ] Student can resume onboarding after closing browser.
- [ ] Student can sign out and sign back in.
- [ ] Password reset/recovery path is tested.

Parent flow:
- [ ] Parent signup works.
- [ ] Parent/student linking requires an authorized invitation/claim flow.
- [ ] Parent sees only linked students.
- [ ] Parent cannot modify restricted learner records unless explicitly designed.
- [ ] Invitation reuse/expiration behavior is defined and tested.

Admin flow:
- [ ] Admin role cannot be self-selected during public signup.
- [ ] Admin pages verify role server-side or through secure RLS, not UI hiding alone.
- [ ] Administrative support actions are auditable where appropriate.

## 4. Diagnostic gate
- [ ] Fresh student starts secure-v3 diagnostic.
- [ ] Correct answer/explanation is absent from item-delivery payload.
- [ ] Browser bundle does not include the secure diagnostic answer bank.
- [ ] Student cannot request a later question before answering the current position.
- [ ] Answer submission is idempotent.
- [ ] Duplicate submit does not create duplicate scoring.
- [ ] Browser refresh resumes exact question plan.
- [ ] New tab/window resumes exact question plan.
- [ ] New device after sign-in resumes exact question plan.
- [ ] Temporary network failure gives a retry path without losing submitted answers.
- [ ] Diagnostic does not show correct/incorrect feedback while in progress.
- [ ] Completion finalizes mastery only once.
- [ ] Prior testing evidence influences targeted diagnostic emphasis without replacing broad domain coverage.
- [ ] Parent/student dashboards update after completion.

## 5. Prior-assessment upload gate
- [ ] PDF upload tested.
- [ ] CSV upload tested.
- [ ] XLS/XLSX upload tested.
- [ ] Known CTP/ERB report parsing tested against representative synthetic/redacted samples.
- [ ] SAT/PSAT/ACT broad-section score parsing tested.
- [ ] Unknown/generic report does not affect personalization until validation threshold is met.
- [ ] Native score types are preserved; scale scores are not mislabeled as mastery percentages.
- [ ] File-size/type limits enforced.
- [ ] Storage bucket private.
- [ ] Student can add another report after one is already on file.
- [ ] “I don’t have scores” disappears once verified testing is on file.
- [ ] Uploaded report deletion/retention behavior matches final privacy policy.

## 6. Learning/practice gate
- [ ] Recommended skills reflect combined evidence model.
- [ ] Skill guide explains rule/process before practice.
- [ ] Practice uses a separate bank from diagnostic.
- [ ] Every practice answer shows correct/incorrect feedback.
- [ ] Every practice answer shows the correct answer.
- [ ] Every practice answer shows a reviewed explanation/process.
- [ ] Progress saves after each attempt.
- [ ] Session completion updates mastery once.
- [ ] Mastery update does not overweight tiny samples.
- [ ] Student can review mastered skills without losing history.
- [ ] Empty/missing practice bank fails gracefully.
- [ ] Question rotation reduces immediate repeat/memorization as bank depth grows.

## 7. Progress/roadmap gate
- [ ] Only one Progress Roadmap card appears.
- [ ] Roadmap opens reliably without being overwritten by dashboard renderers.
- [ ] Labels distinguish motivational roadmap from personalized learning plan.
- [ ] XP/achievement rules are documented and deterministic.
- [ ] Roadmap never substitutes gamification for actual mastery evidence.
- [ ] Parent progress metrics match student records.

## 8. Billing gate
No live billing until explicitly approved.

Before live Stripe activation:
- [ ] Product/price IDs match approved public pricing.
- [ ] Test-mode checkout completes.
- [ ] Checkout confirmation is verified server-side.
- [ ] Webhook signing secret verified.
- [ ] Duplicate webhook delivery is idempotent.
- [ ] Entitlement changes only after verified billing state.
- [ ] Customer portal opens for authorized purchaser.
- [ ] Cancellation flow is clear and non-manipulative.
- [ ] Refund policy is documented and consistent with Terms.
- [ ] Failed payment / past-due behavior is defined.
- [ ] Parent/student household entitlement behavior is tested.
- [ ] Test/live Stripe configuration cannot be mixed.

## 9. Privacy/legal gate
Final legal review is required; engineering checklists are not legal advice.

- [ ] Privacy Policy reviewed for actual data flows.
- [ ] Terms of Service reviewed.
- [ ] Subscription/cancellation disclosures reviewed.
- [ ] COPPA applicability and parental-consent design reviewed.
- [ ] Applicable state youth/privacy requirements reviewed.
- [ ] Data-retention schedule approved.
- [ ] Account/data deletion procedure implemented.
- [ ] Security incident contact/process established.
- [ ] Uploaded educational records handling described accurately.
- [ ] Marketing data is separated from learner-performance data by default.
- [ ] No behavioral advertising based on child/learner performance data.
- [ ] Vendor/subprocessor list prepared for final policy.
- [ ] College Board/SAT/PSAT trademark and non-affiliation language reviewed.

## 10. Security gate
- [ ] `npm run validate:security` passes.
- [ ] HTTPS/HSTS active.
- [ ] X-Content-Type-Options active.
- [ ] Frame protection active.
- [ ] Referrer policy active.
- [ ] Permissions policy active.
- [ ] Secure diagnostic browser payload contains no key/explanation.
- [ ] Secure diagnostic response RLS blocks direct browser access/forgery.
- [ ] Server endpoints enforce authenticated role/ownership.
- [ ] Sensitive endpoints enforce request-size/method validation.
- [ ] Abuse/rate-limit strategy exists for auth-sensitive and costly endpoints.
- [ ] Secrets absent from repository/client bundle.
- [ ] Dependency/security update process established.
- [ ] Error messages do not expose service-role/configuration details.
- [ ] Synthetic accounts are used for production smoke tests.

## 11. SEO/trust-site gate
- [ ] `npm run validate:seo` passes.
- [ ] Canonical homepage URL correct.
- [ ] robots.txt intentional.
- [ ] sitemap intentional.
- [ ] Every sitemap URL exists and returns expected status.
- [ ] Every indexable page has unique title/meta description/H1/canonical.
- [ ] Structured data matches visible content.
- [ ] 404 returns a true 404/noindex experience.
- [ ] How It Works page matches actual product.
- [ ] Content Quality page matches actual review workflow.
- [ ] FAQ matches actual billing/support behavior.
- [ ] Privacy/Terms/support routes exist before public acquisition.
- [ ] No fabricated testimonials, rankings, outcome data, or guarantees.
- [ ] Search Console/Bing submission waits for explicit public-launch approval.

## 12. Marketing measurement gate
- [ ] Marketing measurement migration applied.
- [ ] Privacy review approves activation.
- [ ] Public events contain no learner/account identifiers.
- [ ] Authenticated student pages do not emit public marketing page-view events.
- [ ] UTM naming standard documented.
- [ ] Internal/test traffic exclusion method documented.
- [ ] Activation definition locked before campaign measurement.
- [ ] Attribution join, if any, separately reviewed.
- [ ] Ad-platform pixels/SDKs are not added by default to learner pages.

## 13. Support operations gate
Before accepting paying users:
- [ ] Real support email/contact route exists.
- [ ] Ownership for billing, access, privacy, and technical tickets assigned.
- [ ] Standard response templates prepared for common issues.
- [ ] Account access/reset escalation documented.
- [ ] Billing refund/cancellation escalation documented.
- [ ] Uploaded-report parsing issue workflow documented.
- [ ] Content-error report workflow routes questionable items into review/retirement.
- [ ] Security/privacy incident escalation is separate from ordinary support.
- [ ] Support staff never ask users to email passwords or full payment-card details.

## 14. Monitoring gate
Minimum launch monitoring:
- [ ] Vercel deployment/build failures.
- [ ] API 5xx rate.
- [ ] Authentication failures/spikes.
- [ ] Diagnostic start vs completion anomalies.
- [ ] Database/storage errors.
- [ ] Stripe webhook failures once live.
- [ ] Front-end fatal errors.
- [ ] Marketing endpoint errors only after analytics activation.
- [ ] Content error reports.

Define severity levels:
- **SEV-1:** security/privacy exposure, widespread inability to access paid product, billing integrity failure.
- **SEV-2:** major feature unavailable for a meaningful user segment.
- **SEV-3:** isolated workflow defect with workaround.
- **SEV-4:** cosmetic/content issue with no material workflow impact.

## 15. Release procedure
For each launch candidate:
1. Freeze the candidate commit.
2. Run full build validation.
3. Run strict content readiness.
4. Confirm human approval registry.
5. Confirm production migrations/schema.
6. Run synthetic end-to-end regression.
7. Review runtime errors/logs.
8. Verify billing in test mode.
9. Verify privacy/legal/support pages against actual behavior.
10. Record launch-candidate SHA and evidence.
11. Obtain owner approval for public/live transitions.
12. Only then enable approved live systems/campaigns.

## 16. First 72 hours after public launch
- Watch authentication, onboarding, diagnostic, practice, and payment funnels closely.
- Review support tickets daily for repeated failure patterns.
- Do not scale paid acquisition while activation or billing reliability is unclear.
- Freeze major experimental UX changes unless needed to fix a launch issue.
- Tag content defects and remove/retire questionable items rather than defending them.
- Compare traffic sources by activated learner and retained learner, not clicks alone.

## 17. Weekly commercial operating review
Review:
- uptime/error patterns;
- signup → diagnostic → first-learning funnel;
- learner retention;
- content error/QA queue;
- item performance/calibration as sample sizes become meaningful;
- parent engagement;
- subscription/cancellation/refund trends;
- organic search growth;
- campaign cost per activated/retained learner after paid launch;
- privacy/security/support incidents;
- product backlog ranked by user impact and commercial risk.

## 18. Current launch blockers
As of 2026-08-24:
- connected Supabase project reports `INACTIVE`;
- live content-system migrations are therefore unverified;
- independent content approvals have not yet been applied;
- content depth remains below strict commercial launch targets;
- full cross-role regression is incomplete;
- final privacy/legal review is incomplete;
- live billing is intentionally not enabled;
- marketing measurement/outbound campaigns are intentionally not activated.

A green Vercel build is necessary but is not by itself a commercial launch approval.
