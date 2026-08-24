# SATprep.io Information Security Program

Status: pre-launch operational program for engineering and management. It is not a legal opinion or certification. It must be reviewed against actual production vendors, staffing, data flows, insurance requirements, contracts, and applicable law before public launch.

## 1. Purpose
SATprep.io processes account, family, learning, assessment, uploaded-document, and billing-adjacent data. Some users may be minors. This program establishes the minimum administrative, technical, and operational safeguards required before real customer data is accepted at commercial scale.

Security goals:
1. Protect confidentiality of student, parent, account, assessment, and uploaded-record data.
2. Preserve integrity of diagnostics, question content, mastery calculations, billing entitlements, and parent/student relationships.
3. Maintain reasonable availability and reliable recovery.
4. Minimize collection and retention so security burden is not larger than necessary.
5. Keep learner data separate from advertising/marketing use.

## 2. Governance and ownership
Before launch, assign named owners for:
- Executive/security program owner.
- Engineering/security implementation owner.
- Privacy/minors compliance owner.
- Incident commander and backup.
- Vendor/processor review owner.
- Customer support escalation owner.

Review cadence:
- Quarterly security-program review during the first commercial year.
- Immediate review after a material security/privacy incident, significant architecture change, new high-risk processor, new child-data use, or major authentication/billing change.
- Annual documented management approval after the first year unless a shorter cadence remains appropriate.

## 3. Data classification
### Restricted
Highest protection. Examples:
- Uploaded assessment reports.
- Student date of birth / age information.
- Student/parent identity and account records.
- Diagnostic responses and detailed learning profiles when linked to an identifiable learner.
- Parent-child household links.
- Authentication/session secrets.
- Supabase service-role credentials, Stripe secret keys, webhook secrets, signing secrets.

### Confidential
- Subscription/customer identifiers.
- Support records that do not contain Restricted attachments.
- Internal content-review decisions.
- Aggregate business metrics not intended for publication.

### Internal
- Unreleased product roadmap.
- Draft campaigns and commercial plans.
- Synthetic QA records.

### Public
- Approved SEO pages.
- Approved product explanations.
- Approved public pricing/terms after launch sign-off.
- Approved educational examples that do not reveal secure diagnostic content.

Rule: Restricted data must never be placed in marketing event payloads, public analytics attributes, issue titles, public repositories, or unreviewed support tools.

## 4. Data minimization and retention
- Collect only data required for a documented product/account purpose.
- Keep raw uploaded reports only as long as needed for ingestion/review/support; determine a specific maximum retention before launch.
- Separate normalized learning evidence from raw source documents so the raw file can have a shorter lifecycle.
- Maintain a written retention schedule aligned with the privacy notice.
- Do not retain child personal information indefinitely.
- Define deletion propagation across database records, storage objects, backups, support systems, and processors.
- Marketing attribution must not store test scores, skills, school, DOB, uploaded-document contents, or diagnostic answers.

## 5. Authentication and authorization
- Supabase service-role credentials remain server-only and must never be bundled into browser code.
- Browser access must rely on publishable credentials plus RLS/authorized APIs.
- Parent access is limited to explicitly linked students.
- Students must not access sibling data or parent billing secrets.
- Admin privileges must come from server-controlled authorization, never user-editable browser metadata.
- Sensitive server routes must validate authenticated identity and ownership on each request.
- Under-13 learner activation must remain parent-controlled after the final consent design is implemented.
- Review dormant privileged accounts at least quarterly.

## 6. Secret management
- Store production secrets only in approved secret/environment stores.
- Never commit secrets to GitHub.
- Use distinct test and production Stripe credentials.
- Rotate a secret immediately if exposure is suspected.
- Maintain a secret inventory covering owner, purpose, location, environment, creation/rotation date, and revocation path.
- Prefer narrowly scoped keys where providers support them.

## 7. Application security baseline
Required pre-launch controls:
- HTTPS/HSTS.
- Content Security Policy.
- Anti-framing protection.
- MIME-sniffing protection.
- Referrer and browser permissions restrictions.
- Server-side authorization for sensitive operations.
- Durable route-specific rate limits for diagnostic, activation, family setup, invitations, and billing routes.
- Fail-closed behavior for privileged operations if required abuse-control infrastructure is unavailable.
- Input length/type/format validation on server APIs.
- No diagnostic answer keys/explanations delivered to the browser during assessment.
- Secure response provenance for diagnostic scoring.
- Private storage for uploaded assessment records.

The production build must run content, approval, SEO, security, and launch validators before deployment.

## 8. Secure development process
For each production-affecting change:
1. Identify security/privacy-sensitive data touched.
2. Prefer server-authorized operations over browser-direct writes for sensitive records.
3. Add validation/guardrails to automated build checks when a regression would be dangerous.
4. Use synthetic data for screenshots, demos, automated QA, and public examples.
5. Verify Vercel build success before treating the change as deployable.
6. For schema/RLS changes, run Supabase security/performance advisors after migration.
7. Do not claim a pending migration is live until directly verified.

High-risk changes requiring focused review:
- Authentication/signup.
- Parent-child linking.
- Under-13 consent/activation.
- RLS.
- File uploads/storage.
- Billing/webhooks/entitlements.
- Diagnostic scoring/content delivery.
- Marketing analytics joins.
- Deletion/retention jobs.

## 9. Dependency and vulnerability management
Before public launch:
- Establish automated dependency vulnerability scanning for npm dependencies.
- Review high/critical findings before each production release.
- Establish a routine patch cadence for supported dependencies and runtime versions.
- Remove unused libraries and test-only packages from production.
- Track material security advisories for Supabase, Vercel, Stripe, Vite, and major parsing libraries.

Emergency patch standard: known exploitable critical issues affecting exposed production surfaces should be evaluated immediately and remediated on an accelerated basis.

## 10. Logging and monitoring
Logging should support security investigation without becoming a second sensitive-data store.

Log:
- Security-relevant API failures/status classes.
- Authentication anomalies where available.
- Rate-limit activation counts.
- Stripe webhook processing status without sensitive payment data.
- Deployment and migration identifiers.
- Admin/security configuration changes where available.

Do not log by default:
- Passwords/tokens/secrets.
- Full uploaded score-report content.
- Diagnostic answer text when an event ID is sufficient.
- DOB.
- Full child profiles.
- Free-form support content into analytics.

Before launch, define retention for Vercel/Supabase/application logs and confirm processor settings match the approved policy.

## 11. Vendor and processor security
Maintain a processor register. For every vendor receiving Restricted or Confidential data:
- Document the data and purpose.
- Review security/privacy and child-data terms.
- Review subprocessors/material hosting locations where relevant.
- Confirm deletion/export capabilities.
- Configure minimum practical retention.
- Disable unnecessary advertising/model-training/product-improvement uses where configurable.
- Document the basis for concluding the provider can maintain appropriate confidentiality, security, and integrity.
- Obtain/document written contractual assurances as required by the final compliance/legal design.

Initial processors to review: Supabase, Vercel, Stripe, selected transactional email provider, analytics provider if any, support platform if any, and error-monitoring/observability vendor if any.

## 12. Billing security
- Card data should remain within Stripe-hosted payment flows; SATprep.io should not collect raw card numbers/CVC.
- Verify Stripe webhook signatures on the server.
- Treat subscription entitlements as server-authoritative.
- Keep test/live environments and keys separate.
- Rate-limit checkout/portal/session confirmation endpoints.
- Do not expose billing management to under-13 student accounts.
- Require explicit approval before switching production billing live.

## 13. Backups, continuity, and recovery
Before launch:
- Document Supabase backup/recovery capabilities and actual plan configuration.
- Define recovery point/recovery time objectives appropriate for the early product.
- Test restoration/recovery using non-production or safely isolated data where possible.
- Ensure backup retention does not silently defeat child-data deletion/retention commitments; document the backup expiration lifecycle.
- Maintain an operational path to pause signups/billing if a core dependency becomes unavailable.

## 14. Incident response
Follow `docs/INCIDENT_RESPONSE.md`.

Minimum incident sequence:
1. Triage severity and affected data/systems.
2. Contain access/exposure.
3. Preserve relevant evidence while minimizing unnecessary personal-data duplication.
4. Rotate/revoke exposed credentials.
5. Identify root cause and affected users/data.
6. Assess contractual/legal notification requirements with qualified counsel.
7. Restore safely and verify controls.
8. Document lessons and update this program/build validators.

Potential child-data or cross-household exposure is automatically high-priority for escalation.

## 15. Personnel and support access
Before real customer launch:
- Define staff roles and least-privilege access.
- Require strong authentication/MFA on GitHub, Vercel, Supabase, Stripe, email, analytics, and support systems where available.
- Limit production database access to staff who need it.
- Train support personnel not to request passwords, full payment data, or unnecessary child records.
- Define approved secure channel for sensitive support attachments if support will accept them.
- Revoke access promptly when a staff/contractor role ends.

## 16. Marketing and analytics separation
- No behavioral advertising using child learner data.
- No customer-list matching using child account data without a specifically reviewed lawful design; default is not to do it.
- No marketing audience based on test score, skill weakness, uploaded assessment, school, disability/accommodation, or DOB.
- Public marketing measurement should use privacy-minimized campaign/event fields.
- Any attribution join from anonymous marketing events to an account must be separately approved and minimized.

## 17. Accessibility as operational reliability
Accessibility failures can prevent users from exercising account, billing, support, or privacy rights.

Minimum launch checks:
- Keyboard-only access to signup/login/diagnostic/practice/billing/privacy-request flows.
- Visible focus.
- Accessible form labels and error announcements.
- Zoom/reflow and mobile touch-target review.
- Reduced-motion support.
- Screen-reader review for critical flows.

Baseline CSS safeguards are present, but no WCAG-conformance claim should be made until manual/automated review supports it.

## 18. Required evidence before launch sign-off
Maintain a launch evidence folder/report containing:
- Successful production build/validator result.
- Production RLS verification.
- Supabase security/performance advisor results after migrations.
- Secure diagnostic start/resume/finish test results.
- Rate-limit 429 and fail-closed 503 tests.
- Parent/student cross-account isolation tests.
- Upload privacy/path tests.
- Stripe test-mode checkout/webhook/portal tests.
- Content approval/readiness report.
- Accessibility regression results.
- Processor register and approved retention schedule.
- Privacy/terms/legal review sign-off.

## 19. Open gates
This program is drafted, but commercial launch remains blocked on:
- Active/verified production database and pending migrations.
- Full RLS and account-isolation validation.
- Independent content approval and sufficient question depth.
- Final retention/deletion schedule and tested jobs.
- Final parental-consent implementation.
- Processor/security contractual review.
- Manual accessibility regression.
- Live billing verification and approved terms.
- Final privacy/legal review and operating ownership assignments.
