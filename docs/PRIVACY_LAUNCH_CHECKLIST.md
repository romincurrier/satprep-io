# SATprep.io Privacy / Minors Launch Checklist

Status: engineering and product checklist, not a substitute for legal advice. Final public policies and consent mechanisms require qualified legal review before commercial launch.

## Current regulatory baseline checked in August 2026
FTC materials state that COPPA generally requires covered operators to provide notice and obtain verifiable parental consent before collecting personal information online from children under 13, subject to limited exceptions. The FTC's 2025 final COPPA amendments also strengthened requirements around third-party advertising/disclosures, data minimization/retention, and parent control. In February 2026 the FTC issued a policy statement addressing certain age-verification uses when strict conditions are satisfied.

Engineering posture for SATprep.io should therefore be conservative: collect less, separate learning data from marketing, avoid advertising uses of child data, and require parent/guardian control for under-13 accounts.

## 1. Age and account setup
- [x] Ask age before collecting a child's name in the public student-signup path.
- [x] Under-13 path requests only parent/guardian contact information and stops child self-registration.
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

## 3. Parental notice and consent
Before under-13 data collection beyond a permitted limited exception:
- [ ] Deliver direct parent/guardian notice describing what is collected, why, how it is used, disclosure practices, retention, and parent rights.
- [ ] Obtain verifiable parental consent using a legally reviewed method.
- [ ] Log consent version, timestamp, method, and responsible parent account.
- [ ] Make consent revocable.
- [ ] Provide a parent mechanism to review the child's stored personal information.
- [ ] Provide a parent mechanism to request deletion and prevent further collection/use where required.
- [ ] Ensure deletion propagates to primary databases, file storage, and downstream processors according to the retention/deletion design.

## 4. Advertising and marketing separation
- [ ] No behavioral advertising to under-13 users.
- [ ] No disclosure of child personal information for targeted advertising without the legally required separate parental opt-in; default SATprep.io policy should be not to do this at all.
- [ ] No Meta/TikTok/Google customer-list matching using student records or child account emails.
- [ ] No marketing pixel should receive diagnostic answers, score data, uploaded-report data, skill mastery, age/date-of-birth, or school information.
- [ ] Public-site analytics should remain aggregate/minimal until privacy review approves any stronger attribution design.
- [ ] Use synthetic examples in public marketing by default.

## 5. Retention and deletion
FTC's amended COPPA rule requires covered operators to retain children's personal information only as long as reasonably necessary for the specific purposes for which it was collected and not indefinitely.

Required launch work:
- [ ] Adopt a written data-retention schedule covering child data.
- [ ] Assign a retention purpose and maximum period to each data category.
- [ ] Define shorter retention for raw uploaded score-report files than for normalized learning signals unless a documented need supports longer storage.
- [ ] Define what happens to learning records after subscription cancellation.
- [ ] Define parent-request deletion SLA and verification process.
- [ ] Build automated deletion/anonymization jobs where practical.
- [ ] Confirm backups have a documented expiration/deletion lifecycle.
- [ ] Document legal/financial records that must be retained separately from learning data.

## 6. Security controls
- [x] Keep Supabase service-role credentials server-side only.
- [x] Secure diagnostic delivery does not return answer keys/explanations to the browser during assessment.
- [x] Production API responses use no-store and baseline security headers.
- [x] Global hosting headers include HTTPS/HSTS, anti-framing, nosniff, referrer, and permissions restrictions.
- [ ] Verify production RLS for every table containing student or parent data.
- [ ] Verify parent access is restricted to explicitly linked students.
- [ ] Verify admin access cannot be self-assigned through browser metadata.
- [ ] Add and test API abuse/rate controls for account, invitation, upload, and billing endpoints.
- [ ] Perform dependency/security scanning before release and establish a patch cadence.
- [ ] Define incident-response owner, severity levels, containment process, parent/user notice assessment, and evidence preservation.
- [ ] Define least-privilege staff/admin roles before real customer data is present.

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
- [ ] Document data sent.
- [ ] Confirm child/minor-data terms and data-processing terms.
- [ ] Confirm data location/subprocessors where material.
- [ ] Disable unnecessary advertising/product-training uses where configurable.
- [ ] Configure retention to the minimum practical period.
- [ ] Confirm deletion/export support.

## 8. Public privacy notices
Final policy must be drafted/reviewed only after the data inventory and processor register are accurate. It should clearly address:
- What information is collected from parents, teens, and children.
- How uploaded assessment records are used.
- How diagnostic/learning data is used.
- Parent rights for under-13 accounts.
- Retention and deletion.
- Service providers/processors.
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

## 10. Launch gate
Commercial public launch should remain blocked until qualified counsel reviews the real data flow, age design, parental consent, privacy notice, retention schedule, terms, marketing/analytics configuration, and applicable state-law obligations.

Primary official references used for this checklist:
- FTC, Complying with COPPA: Frequently Asked Questions.
- FTC, 16 CFR Part 312 COPPA Final Rule Amendments, published April 22, 2025.
- FTC, January 16, 2025 announcement of final COPPA amendments.
- FTC, February 2026 COPPA age-verification policy statement.
