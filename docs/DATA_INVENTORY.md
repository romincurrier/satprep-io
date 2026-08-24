# SATprep.io Personal Data Inventory and Data-Flow Map

Status: pre-launch engineering inventory derived from the repository and known product architecture as of 2026-08-24. It must be reconciled against the live Supabase schema, storage buckets, vendor settings, and production logs after the currently inactive database is intentionally restored. This document is not a legal determination of data classification or lawful basis.

## 1. Inventory principles
- Collect only what supports a defined account, learning, family, security, support, or billing purpose.
- Treat learner-linked test/learning data as Restricted even when it is not legally classified as a special category in every jurisdiction.
- Keep marketing measurement separate from learner performance.
- Never place passwords, auth tokens, raw score-report contents, diagnostic answers, DOB, school information, or detailed skill weaknesses in marketing event payloads.
- Use synthetic records for demos, screenshots, QA fixtures, and public marketing.

## 2. Account and identity data
| Data | Typical source | Purpose | Storage/system | Sensitivity | Current notes |
| --- | --- | --- | --- | --- | --- |
| Auth user ID | Supabase Auth | Stable account identity | Supabase Auth / profile linkage | Restricted | Primary key for profile ownership |
| Email | Parent/student signup | Login, account communication, family setup | Supabase Auth + profiles | Restricted | Under-13 public flow asks only for parent/guardian email before child identity collection |
| First/last name | Parent or eligible student signup | Account display/support | profiles; student records where applicable | Restricted | Do not use in marketing attribution |
| Role | Signup/server-controlled profile | Authorization | profiles | Confidential | Public signup should only create student/parent roles; admin assignment must be server/operations controlled |
| Date of birth / age band | Student signup | Age-appropriate account flow | auth metadata/student account design | Restricted | Teen signup is currently DOB-guarded; final correction/retention policy remains open |
| Household identifier | Family setup | Link billing/parent/student records | profiles/students/subscriptions | Restricted | Cross-household isolation is a launch test |

## 3. Learner profile and planning data
| Data | Purpose | Storage | Sensitivity | Notes |
| --- | --- | --- | --- | --- |
| Display name | Student UI | students | Restricted | Avoid public use |
| Grade level | Personalization | students | Restricted | Do not use for ad targeting |
| Current math course | Personalization | students | Restricted | Learning use only |
| Target exam | Plan construction | students | Confidential/Restricted when linked | SAT/PSAT selection is product data, not advertising segmentation |
| Target score | Goal setting | students | Restricted | Never market-segment on score goal without separately reviewed design |
| Target test date | Planning cadence | students | Restricted | May drive in-product reminders; marketing communications require consent/legal review |
| Prior-testing decision/notes | Onboarding | students | Restricted | Prefer structured/minimized fields over free text |
| Recommended path / learning model | Adaptive sequencing | students | Restricted | Derived from prior evidence, diagnostic, and practice |

## 4. Prior assessment and uploaded document data
| Data | Purpose | Storage | Sensitivity | Notes |
| --- | --- | --- | --- | --- |
| Uploaded PDF/spreadsheet report | Source evidence | private assessment-report storage | Restricted | Must remain private and inaccessible by guessed path |
| File name/path | Retrieval/support | prior assessment record | Restricted | Path must never create public access |
| Extracted text | Parsing/debug/review | prior assessment record | Restricted | Current parser code can retain extracted report text; retention should be shorter than normalized evidence unless justified |
| Native section scores | Personalization | prior assessment/extracted data | Restricted | Preserve score type; do not misinterpret ACT/SAT/etc. as percentages |
| Percentiles/stanines/mastery | Personalization | prior assessment/evidence | Restricted | Learning use only |
| Assessment date/type | Weighting/context | prior assessment/evidence | Restricted | Not advertising data |
| Canonical skill evidence | Adaptive learning | student_skill_evidence / learning model | Restricted | Normalized evidence may outlive raw file if retention policy permits |
| Parser confidence/status/error | QA/support | prior assessment | Confidential | Do not expose parser internals publicly |

## 5. Diagnostic data
| Data | Purpose | Storage | Sensitivity | Notes |
| --- | --- | --- | --- | --- |
| Diagnostic attempt ID/status/timestamps | Resume/completion | diagnostic_attempts | Restricted | Exact question plan is persisted for resume continuity |
| Selected diagnostic items/positions | Stable assessment plan | diagnostic_attempt_items (secure-v3) | Restricted / proprietary | Student may need position/progress, but item-bank exposure should be minimized |
| Selected answer | Assessment evidence | diagnostic_responses | Restricted | secure-v3 response should be server-scored |
| Correctness | Mastery evidence | diagnostic_responses | Restricted | Not marketing data |
| Response time | Calibration/adaptive evidence | diagnostic_responses | Restricted | Set validation bounds; do not use for advertising |
| Domain/skill/difficulty metadata | Learning model | diagnostic response/summary | Restricted when linked | Used to form learning priorities |
| Diagnostic mastery summary | Learning model | diagnostic_attempts/students | Restricted | Learning signal only; not an official SAT/PSAT score prediction |

## 6. Practice, lesson, and mastery data
| Data | Purpose | Storage | Sensitivity | Notes |
| --- | --- | --- | --- | --- |
| Lesson/session progress | Resume/retention | lesson_progress | Restricted | Parent visibility only through authorized linkage |
| Practice question attempts | Teaching/mastery | question_attempts | Restricted | Includes selected/correct answer and response timing in current schema |
| Skill mastery | Sequencing/progress | skill_mastery | Restricted | Parent may see linked learner progress; no ad targeting |
| Completed lessons | Progress/journey | lesson_progress | Restricted | Aggregate can support product analytics if privacy-reviewed |
| Achievements/XP/stage | Motivation/progress | student_achievements/student_journey | Restricted when linked | Not meaningful as marketing audience data |

## 7. Family and parent-link data
| Data | Purpose | Storage | Sensitivity | Notes |
| --- | --- | --- | --- | --- |
| Parent-student link | Access control | parent_students / household model | Restricted | Must prevent access to unlinked learners |
| Parent invitation token/status | Household setup | invitation table/API | Restricted | Token should be treated as a credential and not logged unnecessarily |
| Parent setup request email | Under-13 setup | parent_setup_requests | Restricted | Protected server endpoint returns uniform success to reduce enumeration risk |
| Parent dashboard views | Family progress | browser-authorized queries | Restricted | Only linked student data should be returned |

## 8. Billing and entitlement data
| Data | Purpose | Storage/system | Sensitivity | Notes |
| --- | --- | --- | --- | --- |
| Stripe customer ID | Billing management | subscriptions + Stripe | Confidential | Not raw card data |
| Stripe subscription ID/status | Entitlement | subscriptions + Stripe | Confidential | Server/webhook authoritative |
| Plan key | Entitlement | subscriptions | Confidential | Public billing is currently gated |
| Trial/subscription dates | Billing | subscriptions | Confidential | Final public trial terms not approved |
| Checkout/session IDs | Transaction completion | server/Stripe | Restricted credential-like | Avoid persistent/log exposure beyond need |
| Raw card number/CVC | Payment processing | Stripe only | Not intended to enter SATprep.io systems | Stripe-hosted flow should remain the design |

## 9. Marketing and public-site measurement
Pending design uses privacy-minimized event names and UTM fields.

Allowed public attribution concepts after approval:
- page/event name from an approved allowlist
- anonymous/session-safe event identifier
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and paid keyword where supplied
- landing path/referrer class where privacy-reviewed
- coarse device/browser operational metadata only if needed and provider terms support it

Prohibited marketing payload data:
- name/email/phone
- DOB/age
- school
- test score/percentile/stanine
- target score
- uploaded assessment file/text/path
- diagnostic answer/correctness
- skill weakness/mastery
- parent-child relationship
- free-text support/onboarding content

Any future attribution join from public marketing events to a customer account must be explicitly reviewed, minimized, documented here, and reflected in the privacy notice.

## 10. Support and incident data
Potential support data:
- account identifier/email
- issue category/status
- minimal technical metadata needed to reproduce a problem
- attachments only through an approved secure channel

Support staff should not request:
- passwords/auth tokens
- full payment card data
- unnecessary DOB
- entire score reports when a redacted screenshot or assessment ID is sufficient

Incident evidence may temporarily include Restricted data needed to determine scope. Evidence must be access-limited and deleted/archived according to the incident and retention policy after the need ends.

## 11. Content/editorial data
Proprietary content records include item stems, choices, answer keys, explanations, reviewer decisions, approval hashes, calibration summaries, and retirement status. These are generally Internal/Confidential rather than learner personal data, but secure diagnostic items/answers are commercially sensitive and should remain server-side.

## 12. System-level metadata and logs
Potential operational logs include:
- route/status/error class
- request/deployment IDs
- authentication anomalies
- rate-limit activation
- webhook processing status
- migration/build identifiers

Do not intentionally log passwords, tokens, Stripe secrets, full child profiles, full score-report text, DOB, or raw diagnostic payloads when an item/attempt ID is sufficient.

## 13. Data flows
### Parent account
Browser → Supabase Auth → profile → family/student link → authorized student/progress reads.

### Eligible student account
Browser → age/DOB gate → Supabase Auth → student profile → onboarding → diagnostic/practice/learning.

### Under-13 initial setup
Browser asks only for parent/guardian email → protected `/api/parent-setup-request` → server rate-limit/origin validation → service-role persistence → parent-controlled continuation after final consent workflow is implemented.

### Prior assessment
Authorized student/parent → private upload → parser → native extracted score/evidence → validated normalized learning signals → adaptive model. Raw document is never a marketing source.

### Secure diagnostic
Authenticated browser → server diagnostic-session/item endpoint → item prompt/choices only → answer endpoint → server scoring/provenance → diagnostic response → final learning summary. Answer keys/explanations do not ship to the browser during assessment.

### Practice
Authenticated learner → approved practice content → response → correctness + explanation → mastery/lesson progress → updated learning model.

### Billing
Authorized billing owner → SATprep.io server route → Stripe-hosted checkout/portal → signed Stripe webhook/server confirmation → subscription/entitlement. Public billing UI remains prelaunch-gated.

## 14. Storage/processor map
Known processors/systems:
- Supabase: authentication, database, private storage.
- Vercel: hosting, serverless/API execution, deployment/runtime logs.
- Stripe: hosted payment/subscription processing when billing is activated.
- GitHub: source code/configuration; no real learner data should be committed.

Future vendors such as transactional email, analytics, support, and error monitoring are not selected/approved and must not receive learner data by default.

## 15. Inventory reconciliation checklist after Supabase reactivation
- [ ] Generate/list live tables, views, functions, policies, triggers, and storage buckets.
- [ ] Compare every live field/table against this inventory and document differences.
- [ ] Verify RLS/privileges for each Restricted-data table.
- [ ] Review actual storage policies for assessment uploads.
- [ ] Review live log payloads for accidental personal-data leakage.
- [ ] Review Stripe metadata fields used by server routes/webhooks.
- [ ] Review auth user metadata and decide which fields should move into more tightly controlled tables.
- [ ] Assign final retention period and deletion method to every category.
- [ ] Map every processor recipient and data field into `docs/PROCESSOR_REGISTER.md`.
- [ ] Make final privacy notice match the reconciled inventory—not this draft architecture.
