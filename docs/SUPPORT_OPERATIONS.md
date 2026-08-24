# SATprep.io Support Operations Playbook

Status: pre-launch operating material. Final support contacts, SLAs, refund rules, privacy procedures, and legal statements must match the approved public policies before launch.

## Support principles
- Resolve access and learning-workflow problems without asking for unnecessary student data.
- Never ask a user to send a password, full payment-card number, authentication token, or Supabase/Stripe secret.
- Treat uploaded score reports and student performance as private educational data, not ordinary marketing/support context.
- Use synthetic data when reproducing a problem whenever possible.
- Separate ordinary support, content-quality reports, billing disputes, and security/privacy incidents into different escalation paths.

## Ticket categories
### Account access
Examples: cannot sign in, email verification issue, password reset, account role mismatch.
Owner: customer support / technical support.
Escalate immediately if another person's account/data appears.

### Student onboarding
Examples: learner profile stuck, target exam/score not saving, prior-testing step confusing.
Owner: product support.
Record the page/workflow and error message; do not request a full uploaded report unless necessary and approved for secure intake.

### Diagnostic
Examples: cannot start/resume, duplicate question, progress appears lost, answer will not save.
Owner: technical/product support.
First checks:
1. Confirm user is signed in to the intended student account.
2. Confirm whether the diagnostic is legacy or secure-v3 from server/admin evidence, not by asking the user to inspect code.
3. Verify the open attempt and saved response count.
4. Do not reset/delete an attempt merely to clear the UI without preserving evidence.
5. Never reveal the answer key while an initial diagnostic is in progress.

### Prior-assessment upload
Examples: PDF/spreadsheet not accepted, parser needs review, score fields look wrong.
Owner: product/content support.
Rules:
- preserve the original uploaded report securely;
- do not use uncertain extracted data for personalization;
- label parser issues as `needs_review` rather than guessing;
- report parser type/version and the field that failed;
- never reinterpret ACT/SAT/PSAT scale scores as percent mastery merely for convenience.

### Learning/practice
Examples: answer feedback wrong, explanation unclear, mastery update unexpected, no practice questions available.
Owner: content/product support.
A claimed wrong answer/explanation is a content-quality report and must enter the content-review queue before the item is used further if the problem is plausible.

### Parent dashboard/linking
Examples: parent cannot see linked student, wrong child displayed, invite problem.
Owner: account/product support.
Any cross-household/cross-student visibility is a privacy/security incident, not a normal support ticket.

### Billing
Examples: checkout failure, duplicate charge, cancellation, refund, portal access.
Owner: billing support.
Rules:
- verify payment state through Stripe/server records, not screenshots alone;
- never request full card details;
- do not promise a refund outside the approved refund policy;
- never manually grant paid entitlement solely because a browser reported checkout success.

### Content quality
Examples: ambiguous question, wrong key, bad distractor, misleading explanation, off-spec skill, possible copied question.
Owner: content lead/reviewer.
Immediate action if credible: remove/disable the item from future production selection pending review. Preserve historical attempt data for audit/calibration unless deletion is required by policy.

### Privacy/security
Examples: student sees another student's data, exposed score report, suspicious login, leaked token, answer-key exposure, unexpected admin access.
Owner: incident lead.
Do not continue ordinary troubleshooting in a public/shared channel. Follow the security/privacy incident process and preserve relevant logs/evidence.

## Severity model
### SEV-1 — critical
- confirmed/suspected unauthorized exposure of learner/private data;
- authentication/authorization bypass;
- production secret exposure;
- billing integrity issue affecting many customers;
- widespread inability to access a paid service with no workaround.

Actions: stop unsafe exposure, preserve evidence, notify incident owner, consider disabling affected feature, begin legal/privacy notification assessment.

### SEV-2 — major
- diagnostic or learning flow unavailable for a meaningful segment;
- parent/student linking broadly broken;
- checkout/cancellation broadly broken;
- systematic scoring/content defect affecting many items/users.

Actions: triage immediately, mitigate, communicate known workaround/status through approved channel, deploy tested fix.

### SEV-3 — moderate
- isolated functional defect with workaround;
- single parser/report format failure;
- individual billing/account issue without security exposure.

Actions: normal priority support plus product backlog linkage.

### SEV-4 — minor
- cosmetic/layout issue;
- copy confusion;
- low-impact content formatting issue.

Actions: log and batch with UX/content maintenance.

## Information to collect for technical tickets
Collect only what is needed:
- account role (student/parent/admin) without password;
- page/workflow;
- approximate time of issue;
- browser/device type when relevant;
- visible error text;
- whether refresh/sign-out/sign-in was attempted;
- synthetic or redacted screenshot if needed;
- server request/error ID if the product exposes a safe support ID in the future.

Avoid collecting:
- passwords;
- full payment-card data;
- raw auth tokens;
- entire score reports in ordinary email;
- unrelated student educational records;
- advertising identifiers.

## Diagnostic progress-loss procedure
1. Do not tell the student to restart immediately.
2. Query the current open attempt and saved response count through authorized support/admin tooling.
3. Confirm the attempt's saved question plan.
4. Confirm the next unanswered position.
5. Confirm the client is routing to the correct engine.
6. If the attempt exists, repair resume/navigation rather than replacing it.
7. If responses are truly missing, preserve logs and determine whether a write failure occurred before creating a new attempt.
8. Document any data repair.

## Question/content error procedure
1. Capture item ID, content version/hash, reported problem, and relevant explanation.
2. Independently solve/evaluate the item.
3. If credible ambiguity/error exists, mark the item for retirement/revision before future selection.
4. Route through the independent content review workflow.
5. A source edit invalidates prior hash approval automatically.
6. Determine whether prior student mastery estimates materially depended on the defective item.
7. If necessary, define a remediation/recalculation plan rather than silently changing historical outcomes.

## Billing support procedure
1. Authenticate the account holder under the approved support process.
2. Inspect server-side subscription/customer state.
3. Confirm the requested action: portal access, cancellation, refund inquiry, failed payment, duplicate charge.
4. Use Stripe's supported customer/subscription objects; do not store card details in SATprep.io support systems.
5. Record the resolution and effective access/billing date.
6. Escalate chargeback/fraud patterns separately.

## Privacy request procedure
Final legal procedures must determine identity verification and statutory timelines. Engineering/support must be able to route requests for:
- access to account data;
- correction;
- deletion;
- account closure;
- parent/guardian questions about child data;
- marketing communication preferences.

Never delete production records ad hoc from a support chat without the approved deletion workflow and audit requirements.

## Public status communication
Before launch, define a real support/status route. During incidents:
- acknowledge confirmed impact without speculating;
- state what users should do now;
- avoid publishing security-sensitive exploit details while mitigation is active;
- do not promise restoration times unless operations can support the promise;
- update when status materially changes.

## Support macros to prepare in the actual support platform
These are subjects/topics, not final customer-facing copy:
- account verification / password reset guidance;
- diagnostic progress saved / resume troubleshooting;
- uploaded report received but needs manual review;
- content question under review;
- billing portal/cancellation guidance;
- refund request acknowledgment;
- parent linking/invitation help;
- privacy request acknowledgment;
- incident acknowledgment.

Final wording must match actual product routes and approved policies.

## Weekly support review
Track aggregate, privacy-safe counts by:
- category;
- severity;
- affected workflow;
- resolution time;
- repeat issue/root cause;
- content item/parser version when relevant;
- refunds/cancellations reason category where lawfully collected.

Use support trends to prioritize product fixes. Do not turn support content containing student performance into advertising audiences.

## Pre-launch support gates
- [ ] Public support/contact route exists.
- [ ] Support mailbox/helpdesk ownership assigned.
- [ ] Password/card/token handling rules documented.
- [ ] Diagnostic progress-loss procedure tested.
- [ ] Billing/cancellation/refund policy and process aligned.
- [ ] Content-error retirement/re-review workflow tested.
- [ ] Privacy/security escalation owner defined.
- [ ] Account/data deletion workflow defined.
- [ ] Synthetic support test cases completed across student/parent/billing/content flows.
