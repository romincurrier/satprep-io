# SATprep.io Privacy / Minors Launch Checklist

Status: engineering and product checklist, not a substitute for legal advice. Final public policies, consent mechanisms, retention schedules, processor terms, and state-law analysis require qualified legal review before commercial launch.

## Current regulatory baseline checked in August 2026
FTC materials state that COPPA generally requires covered operators to provide notice and obtain verifiable parental consent before collecting personal information online from children under 13, subject to limited exceptions. The amended COPPA Rule was published April 22, 2025. FTC guidance updated in May 2026 emphasizes, among other things, purpose-limited collection, parental rights, a written information-security program, written retention/deletion practices, and reasonable steps to use service providers/third parties capable of protecting children's personal information.

The 2025 amendments also strengthened requirements around disclosures to third parties and targeted advertising, data retention, and the information that must appear in the operator's privacy notice. SATprep.io's engineering posture should therefore be conservative: collect less, keep learning data separate from marketing, avoid advertising uses of child data, and require parent/guardian control for under-13 learner accounts.

## 1. Age and account setup
- [x] Ask age before collecting a child's name in the public student-signup path.
- [x] Under-13 path requests only parent/guardian contact information and stops child self-registration.
- [x] Under-13 setup requests are intercepted into the protected `/api/parent-setup-request` route rather than being persisted directly by the browser in the current application shell.
- [x] Teen signup checks the entered date of birth and blocks account creation through the teen form if the DOB indicates an age under 13 or an invalid/out-of-range date.
- [ ] Remove the legacy browser insert handler from `marketing.js` after the signup flow is refactored to use the protected API natively.
- [ ] Verify that every alternate account-creation route follows the same age gate, including invitations, deep links, mobile layouts, and future social login.
- [ ] Decide and document the approved verifiable parental consent mechanism before creating an under-13 learner profile.
- [ ] Prevent an under-13 student from independently accepting terms, starting a paid trial, or managing billing.
- [ ] Define treatment of a user who changes/corrects date of birth after account creation.

## 2. Data inventory and purpose limitation
Create and maintain a formal inventory for every field collected. For each field record: data element, source, user age category, purpose, legal/consent basis, storage location, recipients/processors, retention period, deletion method, and whether it is required or optional.

High-sensitivity SATprep.io categories requiring explicit review:
- Student name/contact/account identifiers.
- Date of birth / age band.
- Parent/guardian identity and contact information.
- Uploaded score reports and assessment documents.
- Extracted test scores, percentiles, mastery evidence, and learning profiles.
- Diagnostic responses and skill mastery.
- Billing/subscription identifiers.
- Support messages and attachments.

Rules:
- [ ] Do not collect a field merely because it may be useful later.
- [ ] Do not use uploaded assessment data for advertising or ad targeting.
- [ ] Do not use student learning data to build third-party marketing audiences.
- [ ] Do not allow free-form marketing event payloads that could accidentally contain names, scores, schools, or messages.
- [ ] For every child-data field, document the specific purpose that makes collection reasonably necessary.

## 3. Parental notice and consent
Before under-13 data collection beyond a permitted limited exception:
- [ ] Deliver direct parent/guardian notice describing what is collected, why, how it is used, disclosure practices, retention, and parent rights.
- [ ] Obtain verifiable parental consent using a legally reviewed method.
- [ ] If any child information would be disclosed to a third party for targeted advertising or another disclosure requiring separate consent, obtain the required separate parental opt-in. SATprep.io's default design should avoid this disclosure entirely.
- [ ] Log consent version, timestamp, method, and responsible parent account.
- [ ] Make consent revocable.
- [ ] Provide a parent mechanism to review the child's stored personal information.
- [ ] Provide a parent mechanism to request deletion and prevent further collection/use where required.
- [ ] Ensure deletion propagates to primary databases, file storage, and downstream processors according to the retention/deletion design.

## 4. Advertising and marketing separation
- [x] Current prelaunch commercial gate removes unapproved public pricing/trial claims and does not activate third-party advertising trackers.
- [ ] No behavioral advertising to under-13 users.
- [ ] No disclosure of child personal information for targeted advertising without the legally required separate parental opt-in; default SATprep.io policy should be not to do this at all.
- [ ] No Meta/TikTok/Google customer-list matching using student records or child account emails.
- [ ] No marketing pixel should receive diagnostic answers, score data, uploaded-report data, skill mastery, age/date-of-birth, or school information.
- [ ] Public-site analytics should remain aggregate/minimal until privacy review approves any stronger attribution design.
- [ ] Use synthetic examples in public marketing by default.

## 5. Retention and deletion
The amended COPPA framework requires covered operators to retain children's personal information only as long as reasonably necessary for the specific purposes for which it was collected and not indefinitely. FTC guidance also calls for a written data-retention policy addressing children's information and for the applicable retention information to be included in the privacy notice.

Required launch work:
- [ ] Adopt a written data-retention and deletion schedule covering child data.
- [ ] Assign a retention purpose and maximum period to each data category.
- [ ] State, in the final privacy notice, the purposes for collecting child personal information, the business need to retain it, and a deletion timeframe that matches actual operations.
- [ ] Define shorter retention for raw uploaded score-report files than for normalized learning signals unless a documented need supports longer storage.
- [ ] Define what happens to learning records after subscription cancellation.
- [ ] Define parent-request deletion SLA and verification process.
- [ ] Build automated deletion/anonymization jobs where practical.
- [ ] Confirm backups have a documented expiration/deletion lifecycle.
- [ ] Document legal/financial records that must be retained separately from learning data.
- [ ] Test that retention jobs cannot accidentally delete billing/accounting records that must be kept while still removing learning data as required.

## 6. Security controls
FTC's current compliance guidance calls for reasonable procedures to protect children's personal information and a written information-security program appropriate to the sensitivity of the data, the operator's size/complexity, and its activities.

Current engineering controls:
- [x] Keep Supabase service-role credentials server-side only.
- [x] Secure diagnostic delivery does not return answer keys/explanations to the browser during assessment.
- [x] Production API responses use no-store and baseline security headers.
- [x] Hosting headers include HSTS, anti-framing, nosniff, referrer restrictions, permissions restrictions, Cross-Origin-Opener-Policy, and an enforcing Content Security Policy.
- [x] Durable service-role API rate-limiting design is committed for diagnostic, youth/parent setup, activation, and billing routes; live verification awaits the inactive Supabase project.
- [ ] Convert security controls and incident procedures into a formally adopted written information-security program before real customer launch.
- [ ] Verify production RLS for every table containing student or parent data.
- [ ] Verify parent access is restricted to explicitly linked students.
- [ ] Verify admin access cannot be self-assigned through browser metadata.
- [ ] Apply and test API abuse/rate controls after the database is active.
- [ ] Perform dependency/security scanning before release and establish a patch cadence.
- [x] Incident-response severity, containment, evidence-preservation, and recovery guidance is documented in `docs/INCIDENT_RESPONSE.md`.
- [ ] Define least-privilege staff/admin roles before real customer data is present.
- [ ] Establish a documented annual/trigger-based review cadence for the information-security program.

## 7. Third-party processors
Create a processor register before launch. At minimum evaluate:
- Supabase (authentication/database/storage).
- Vercel (hosting/server functions/logging).
- Stripe (billing).
- Transactional email provider when selected.
- Analytics provider if one is added.
- Customer support provider if one is added.
- Error monitoring / observability if one is added.

For each processor:
- [ ] Document data sent and the exact service purpose.
- [ ] Confirm child/minor-data terms and data-processing terms.
- [ ] Confirm data location/subprocessors where material.
- [ ] Disable unnecessary advertising/product-training uses where configurable.
- [ ] Configure retention to the minimum practical period.
- [ ] Confirm deletion/export support.
- [ ] Document why the provider is capable of maintaining confidentiality, security, and integrity of the child data it receives.
- [ ] Obtain/document contractual or other written assurances regarding appropriate safeguards where required by counsel/compliance design.
- [ ] Reassess processors when material product features or data flows change.

## 8. Public privacy notices
Final policy must be drafted/reviewed only after the data inventory and processor register are accurate. It should clearly address:
- What information is collected from parents, teens, and children.
- The purposes for collecting children's personal information and why retention is needed.
- The retention timeframe/deletion policy for children's personal information.
- How uploaded assessment records are used.
- How diagnostic/learning data is used.
- Parent rights for under-13 accounts, including review/deletion/refusal of further collection where applicable.
- Service providers/processors and material disclosure categories.
- Whether information is disclosed to third parties and for what purposes.
- Billing data handling.
- Security practices at an appropriate level.
- Contact method for privacy requests.
- Effective date and change process.
- State-specific rights where applicable.

Do not publish a generic template that misstates actual product behavior.

## 9. Product-design tests before launch
- [ ] Under-13 user cannot create a learner account by changing URL parameters or bypassing the visible age screen.
- [ ] Parent consent/activation is required before under-13 personal learning data is collected.
- [ ] Parent can see only linked students.
- [ ] Student cannot see parent billing secrets or sibling records.
- [ ] Uploaded reports are private and inaccessible by guessed storage paths.
- [ ] Diagnostic answer keys cannot be retrieved from browser source, API payloads, or browser-authorized database queries.
- [ ] Marketing pages do not load unreviewed third-party trackers.
- [ ] Account deletion and child-data deletion are tested on realistic test records.
- [ ] Retention/deletion behavior is verified against the published retention schedule.
- [ ] Processor deletion/export paths are tested for vendors that receive child data.

## 10. Accessibility and child-friendly UX review
Privacy notices and consent flows must be understandable and operationally usable, not merely present.
- [x] Baseline keyboard focus, skip navigation, reduced-motion, touch-target, and higher-contrast preference styles are loaded.
- [ ] Verify notices presented to parents are clear, direct, and distinguish required consent from optional marketing choices.
- [ ] Verify account/consent errors are announced accessibly and do not rely on color alone.
- [ ] Complete manual keyboard, screen-reader, zoom/reflow, and mobile testing.

## 11. Launch gate
Commercial public launch should remain blocked until qualified counsel reviews the real data flow, age design, parental consent, privacy notice, retention schedule, written information-security program, processor terms, marketing/analytics configuration, and applicable state-law obligations.

Primary official references used for this checklist:
- FTC, Complying with COPPA: Frequently Asked Questions (current FTC business guidance).
- FTC, Children's Online Privacy Protection Rule: A Six-Step Compliance Plan for Your Business (updated May 2026).
- FTC, 16 CFR Part 312 COPPA Final Rule Amendments, published April 22, 2025.
- FTC, January 16, 2025 announcement of final COPPA amendments.
- FTC, February 2026 COPPA age-verification policy statement.
