# SATprep.io Incident Response Runbook

Status: pre-launch operating framework. Final notification duties, contacts, insurance/forensics relationships, and legal deadlines require review for the jurisdictions and vendors actually used at launch.

## Scope
Use this process for suspected or confirmed incidents involving:
- unauthorized learner/parent/admin data access;
- exposed uploaded score reports or educational records;
- authentication or authorization bypass;
- leaked Supabase, Stripe, Vercel, email-provider, or other secrets;
- secure diagnostic answer-key exposure;
- malicious modification of diagnostic/practice scoring;
- widespread billing/entitlement integrity failure;
- destructive database/storage events;
- compromised admin account;
- accidental public exposure of private files.

Ordinary UI bugs and isolated content errors follow the support/content workflow unless they create security, privacy, or billing-integrity risk.

## Roles to assign before launch
- Incident lead: coordinates response and decision log.
- Technical lead: containment, logs, remediation, verification.
- Privacy/legal lead: notification/regulatory/contract analysis.
- Customer communications owner: approved user/status communications.
- Billing owner: Stripe/payment/entitlement incidents.
- Content lead: answer-key/item-integrity incidents.

At least two people should know how to access critical production administration securely; do not rely on one personal account without recovery controls.

## Severity
### SEV-1 Critical
Examples: confirmed cross-user private data exposure; active credential/secret compromise; unauthorized admin access; exposed service-role key; widespread incorrect charging; active destructive compromise.

### SEV-2 Major
Examples: credible but unconfirmed exposure with meaningful scope; broad authentication failure; diagnostic integrity compromised for many users; critical vendor outage with material paid-user impact.

### SEV-3 Moderate
Examples: limited security-control failure with no evidence of data access; isolated billing-integrity case; suspicious account activity contained quickly.

## First-response sequence
1. **Open an incident record.** Record detection time, reporter, affected system, known facts, unknowns, and actions. Do not rely on chat history alone.
2. **Preserve evidence.** Preserve relevant Vercel/Supabase/Stripe/auth logs, timestamps, deployment SHA, database evidence, and affected object IDs. Avoid destructive cleanup before evidence is captured when safe.
3. **Contain exposure.** Revoke/rotate compromised credentials, disable an unsafe route/feature, remove public access, suspend affected admin access, or roll back a deployment as appropriate.
4. **Protect users.** If continued use can worsen harm, disable the affected workflow rather than leaving it available while investigating.
5. **Determine scope.** Identify affected accounts/households, data types, time window, operations performed, and whether data was read, altered, deleted, or merely exposed to possible access.
6. **Fix root cause.** Patch code/RLS/configuration, rotate secrets, repair records, or reconcile billing.
7. **Verify containment.** Test the exact exploit/failure path plus adjacent authorization boundaries.
8. **Notification assessment.** Privacy/legal lead determines vendor, contractual, user, state/federal, insurance, payment-provider, or regulator notification obligations and deadlines.
9. **Communicate accurately.** State confirmed facts, actions users need to take, and where updates will appear. Do not speculate about scope or cause.
10. **Post-incident review.** Document timeline, root cause, control failure, impact, detection gap, remediation, and prevention work.

## Secret-exposure response
If a server secret is suspected exposed:
1. Treat it as compromised even if there is no known misuse.
2. Rotate/revoke the credential at the provider.
3. Update server environment configuration.
4. Redeploy if required.
5. Search repository history/build artifacts/logs for the secret.
6. Review access logs for misuse during the possible exposure window.
7. Do not solve a committed-secret incident merely by deleting the current file; repository history must be considered.

Critical secrets include Supabase service-role credentials, Stripe secret/webhook credentials, provider API keys, signing secrets, and privileged admin/session tokens.

## Cross-user data exposure
Examples: parent sees unrelated student; student sees another student's report; insecure object path reveals another report.

Immediate actions:
- capture affected route/query/object and identity relationships;
- disable unsafe access if still possible;
- verify RLS/API ownership checks across the entire related table/storage bucket, not only the one record;
- determine what private fields/files were accessible and whether logs show reads;
- test student→student, parent→unlinked-student, parent→other-household, and unauthenticated boundaries after fix.

## Diagnostic integrity incident
Examples: answer key shipped to browser; user can retrieve later questions/answers; direct response-table access reveals `is_correct`; client can forge secure-v3 response scoring.

Immediate actions:
- disable new affected diagnostic sessions if integrity cannot be preserved;
- preserve existing attempts;
- identify affected diagnostic version/content version;
- patch server delivery/scoring/RLS;
- determine whether affected baseline results should be invalidated/re-administered;
- never silently retain a mastery estimate known to have been compromised.

## Content integrity incident
If a production-approved question has a wrong key/ambiguous wording:
- retire it from new selection immediately if credible;
- preserve its item ID/version/hash and affected attempt history;
- route through independent review;
- estimate whether prior mastery/recommendations materially depend on the item;
- define recalculation/remediation when necessary;
- communicate only when user-facing outcomes materially changed.

## Billing integrity incident
Examples: duplicate charge, entitlement without payment, paid user loses access, webhook replay/processing bug.

Actions:
- use Stripe/server records as source of payment truth;
- stop automatic entitlement mutation if it is producing incorrect state;
- reconcile affected subscriptions/customers;
- preserve webhook/event IDs for idempotency analysis;
- refund/credit only under approved authority/policy;
- test checkout confirmation, webhook replay, cancellation, and portal flows after fix.

Do not collect card details during incident handling.

## Database/storage incident
- verify current backup/PITR availability before destructive repair;
- snapshot/preserve evidence where practical;
- identify whether incident is availability, corruption, deletion, or unauthorized access;
- restore into a safe validation environment before overwriting production when feasible;
- reconcile application state after restore, especially billing entitlements and diagnostic progress created after the restored point.

## Communications rules
- Designate one approved communication owner.
- Separate internal technical details from public status updates.
- Do not identify minors or disclose test scores/educational details in public incident updates.
- Do not promise that “no data was accessed” unless evidence supports it.
- Do not promise a restoration deadline without operational basis.
- Keep required notices consistent across email/status/support/legal channels.

## Evidence/decision log template
Record:
- incident ID;
- severity;
- detected_at / contained_at / resolved_at;
- systems and deployment SHAs;
- affected data categories;
- estimated affected accounts/records;
- detection source;
- containment actions;
- credentials rotated;
- code/config/migration changes;
- legal/privacy decisions and dates;
- communications issued;
- follow-up owners/dates.

## Post-incident review questions
- What control should have prevented this?
- Why did that control fail or not exist?
- How quickly did we detect it?
- What evidence was unavailable but should have been logged?
- Did testing cover the failed authorization/billing/data path?
- Could the same class of issue exist elsewhere?
- Which automated validator/regression test should now be added?
- Did support or product copy worsen user impact?
- Do retention, vendor, or privacy documents need changes?

## Pre-launch incident-readiness checklist
- [ ] Incident lead and backups assigned.
- [ ] Security/privacy/billing escalation contacts available outside the product itself.
- [ ] MFA enabled on critical provider/admin accounts.
- [ ] Secret rotation instructions documented for each provider.
- [ ] Supabase/Vercel/Stripe logs accessible to responders.
- [ ] Backup/restore process confirmed for production plan.
- [ ] Deployment rollback procedure tested.
- [ ] Cross-household authorization regression test exists.
- [ ] Secure diagnostic answer-key leakage regression test exists.
- [ ] Stripe webhook idempotency regression test exists before live billing.
- [ ] Legal/privacy notification workflow reviewed.
- [ ] User/status communication channel established before accepting paying customers.
