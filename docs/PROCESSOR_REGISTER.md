# SATprep.io Processor and Vendor Register

Status: pre-launch working register. Known processors are identified from the current architecture, but contractual terms, subprocessors, retention settings, child-data terms, and production configurations must be reviewed against the vendors' then-current documents before launch. No entry below is a legal conclusion that a vendor relationship satisfies a particular law.

## Register rules
For every service that can receive customer or learner data, record:
1. business purpose;
2. data categories;
3. affected user groups;
4. hosting/logging/retention settings;
5. subprocessors/material transfers where relevant;
6. security/privacy contractual terms;
7. deletion/export process;
8. advertising/model-training/product-improvement settings;
9. internal owner;
10. approval status and last review date.

No new analytics, email, support, error-monitoring, AI, advertising, or CRM service may receive Restricted learner data merely because it is convenient to integrate.

## 1. Supabase
**Role in SATprep.io:** authentication, PostgreSQL database, row-level authorization model, private assessment-report storage, database functions/RPCs, and potentially platform logs.

**Expected data:**
- account email/user ID/auth metadata;
- parent/student/household relationships;
- student profile and learning-plan data;
- diagnostic/practice/mastery/progress records;
- prior assessment metadata, extracted information, and private uploaded files;
- subscription/entitlement identifiers;
- privacy/support operational records if those migrations are activated;
- hashed rate-limit subjects when migration is activated.

**Data subjects:** parents/guardians, eligible teen learners, future parent-approved under-13 learners.

**Sensitivity:** Restricted/Confidential.

**Current engineering controls:**
- service-role credentials server-only;
- browser use through publishable credentials plus RLS/authorized routes;
- secure diagnostic keys server-only;
- private report-storage design;
- pending restrictive secure-v3 diagnostic-response policy;
- pending durable service-role rate-limit RPC/table.

**Open diligence before launch:**
- [ ] Review current Supabase DPA/privacy/security terms and child/minor-data suitability with counsel.
- [ ] Review current subprocessors and material data-location details.
- [ ] Document project region and whether it matches approved data-location design.
- [ ] Verify database backup plan/retention and how backup expiration interacts with deletion requests.
- [ ] Review Auth log/database/API/storage log retention.
- [ ] Verify private storage policies and signed/download access paths.
- [ ] Apply/reconcile pending migrations and run security/performance advisors.
- [ ] Document export/deletion steps for account and uploaded-file requests.
- [ ] Confirm no unneeded data is used for provider advertising/product training.

**Status:** technical integration exists; production project currently INACTIVE and final diligence is open.

## 2. Vercel
**Role in SATprep.io:** web hosting/CDN, Vite deployment, serverless/API execution, security headers, runtime/build/deployment logs.

**Expected data:**
- HTTP request metadata;
- authenticated API requests transiting server functions;
- server runtime/error logs;
- deployment/build metadata;
- environment secrets stored in deployment environment when configured.

**Data subjects:** public visitors and authenticated users.

**Sensitivity:** potentially Restricted if application logs accidentally include learner/user payloads; operational metadata otherwise Confidential.

**Current engineering controls:**
- application APIs intentionally avoid logging full learner records;
- global HSTS/CSP/anti-framing/nosniff/referrer/permissions headers;
- no external marketing tracker has been intentionally added;
- production builds run content, approval, SEO, security, and launch validators.

**Open diligence before launch:**
- [ ] Review current Vercel DPA/privacy/security/child-data terms with counsel.
- [ ] Review current subprocessors/data-location implications.
- [ ] Document runtime/build/log retention and reduce where feasible.
- [ ] Review whether request bodies/headers can appear in logs and ensure sensitive payloads/tokens are not logged.
- [ ] Confirm environment-secret access roles and MFA/account controls.
- [ ] Add/review platform firewall/bot/traffic rules after application-layer authorization remains in place.
- [ ] Document export/deletion implications for logs where applicable.

**Status:** active hosting/deployment integration; legal/configuration review open.

## 3. Stripe
**Role in SATprep.io:** hosted checkout, subscriptions, billing portal, payment authentication, payment methods, invoices, webhooks, customer/subscription identifiers.

**Expected SATprep.io data sent to Stripe after live activation:**
- billing-owner/customer account identity fields needed for payment;
- plan/price selection;
- Stripe customer/subscription/session metadata;
- payment information collected directly by Stripe-hosted surfaces.

**Data that should not be sent as Stripe metadata:**
- diagnostic answers;
- test scores/percentiles;
- skill mastery/weaknesses;
- uploaded assessment contents;
- school information;
- unnecessary child data.

**Data subjects:** billing owners, expected primarily parents/guardians for family/under-13 household contexts.

**Sensitivity:** payment and account information; SATprep.io should not store raw card number/CVC.

**Current engineering controls:**
- hosted Stripe checkout/portal design;
- webhook signature validation expected server-side;
- server-authoritative entitlement flow;
- billing API rate-limit design;
- test/live keys separated by environment design;
- public billing UI is currently gated off on `satprep.io`/`www.satprep.io` while preview QA remains available.

**Open diligence before launch:**
- [ ] Review Stripe services agreement, privacy/DPA, subprocessors, retention, and child/minor implications with counsel.
- [ ] Verify live webhook secret/signature path.
- [ ] Verify live product/price IDs and approved subscription/cancellation/trial terms.
- [ ] Verify customer portal cancellation/refund settings match public terms.
- [ ] Confirm support/accounting retention obligations for transaction records.
- [ ] Confirm metadata remains minimized.

**Status:** architecture/test pathway exists; live activation explicitly not approved.

## 4. GitHub
**Role in SATprep.io:** private/source repository, code review/history, build integration.

**Expected data:** source code, migrations, configuration examples, synthetic/test fixtures, content authoring/review artifacts.

**Prohibited data:** real learner/customer records, uploaded score reports, production exports, passwords/tokens/secrets, raw support attachments.

**Sensitivity:** Internal/Confidential source and proprietary question content.

**Current engineering controls:**
- secrets are intended to be environment-managed rather than committed;
- proprietary content is versioned and production approvals are hash-pinned;
- synthetic data is the default for tests/demos.

**Open diligence:**
- [ ] Require MFA and least-privilege collaborator access.
- [ ] Enable/verify secret scanning/dependency security features available to the account/repository.
- [ ] Establish collaborator offboarding review.
- [ ] Confirm repository visibility/branch protection appropriate for commercial launch.

**Status:** active development processor/service; no customer data should be stored here.

## 5. Transactional email provider — NOT SELECTED
Potential purpose after approval:
- account verification/setup notices;
- parent invitation/setup communication;
- security/account transactional messages;
- consented lifecycle/progress messages where permitted.

**Do not integrate until:**
- [ ] provider is selected and reviewed;
- [ ] data-processing/child-data terms are approved;
- [ ] suppression/unsubscribe design is defined where applicable;
- [ ] templates minimize child data;
- [ ] retention/logging settings are reviewed;
- [ ] transactional and marketing purposes are separated.

Under-13 commercial/lifecycle communications should default to the parent/guardian route unless legal/product review authorizes otherwise.

## 6. Analytics provider — NOT SELECTED
Preferred initial posture: privacy-minimized public/product measurement, with no learner-performance marketing audiences.

**Allowed categories only after approval:**
- allowlisted event name;
- anonymous/session-safe identifier;
- UTM campaign fields;
- page/landing path;
- minimal operational device context where needed.

**Never send by default:** score, skill weakness, DOB/age, school, uploaded assessment, diagnostic answer, child email, parent-child relationship.

**Do not integrate until:**
- [ ] privacy/legal design approves provider and consent model;
- [ ] retention/IP/device settings are configured;
- [ ] child/minor terms are reviewed;
- [ ] cross-site advertising/remarketing features are disabled unless separately approved;
- [ ] event schema is allowlisted and technically enforced.

## 7. Customer support platform — NOT SELECTED
Potential data: account contact, issue category, support message, approved attachments.

**Do not integrate until:**
- [ ] provider security/privacy/child-data terms are reviewed;
- [ ] Restricted attachments have an approved secure channel;
- [ ] retention and deletion procedures are configured;
- [ ] support-role access is least privilege;
- [ ] staff scripts prohibit passwords/full payment data/unnecessary child documents.

## 8. Error monitoring / observability — NOT SELECTED
Potential risk: automatic capture of URLs, request payloads, browser state, DOM text, or user identifiers.

**Do not integrate until:**
- [ ] payload scrubbing is verified before production;
- [ ] session replay is disabled by default and separately reviewed if ever considered;
- [ ] Restricted route/request data is excluded;
- [ ] retention and processor terms are reviewed;
- [ ] user/learner identifiers are minimized or pseudonymized.

## 9. Advertising platforms — NOT CONNECTED / NOT APPROVED
Potential future platforms: Google Ads, Microsoft Ads, Meta, TikTok, education/parent media partners.

Default policy:
- no child learning data as audience data;
- no test score/skill/assessment data;
- no customer-list matching using under-13 or learner records;
- no behavioral advertising to under-13 users;
- no pixels on authenticated learning/diagnostic/upload pages without a separate reviewed design;
- parent-oriented paid campaigns should optimize to privacy-reviewed activation events, not sensitive learner outcomes.

Activation requires explicit approval, budget approval, legal/privacy review, and configured conversion measurement.

## 10. AI/model providers — NONE REQUIRED FOR CURRENT CORE FLOW
The current production candidate should not send identifiable learner records or uploaded assessment documents to an external model provider by default.

Any future AI integration requires a separate processor review covering:
- exact data fields and purpose;
- no model training/data reuse where configurable;
- child/minor terms;
- retention;
- subprocessors/location;
- deletion;
- prompt/output logging;
- human review for high-impact content decisions;
- minimization/redaction before transfer.

## 11. Processor approval record template
For every approved provider, add:
- Provider:
- Service/product:
- Internal owner:
- Approval date:
- Last review date:
- Data categories:
- Data subjects:
- Purpose:
- Contract/DPA version/date:
- Child/minor terms review:
- Subprocessor review:
- Hosting/data-location review:
- Default retention:
- Configured retention:
- Deletion/export procedure:
- Security controls/MFA:
- Advertising/training settings:
- Incident-notification terms:
- Counsel/privacy approval reference:
- Notes/open risks:

## 12. Launch gate
Before commercial launch, the active processors must have completed diligence records and must match the final `DATA_INVENTORY.md`, privacy notice, retention schedule, information-security program, and actual production configuration.
