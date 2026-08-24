# Brand / Domain Transition Plan

Status: prelaunch contingency plan. No rebrand has been approved or executed.

## Why this exists
`docs/TRADEMARK_LAUNCH_GATE.md` records a material unresolved naming/domain issue that must be addressed before public indexing and outbound promotion. If the chosen resolution is a rebrand or domain transition, it should be handled as a controlled technical migration rather than a find-and-replace performed immediately before launch.

Run `npm run brand:inventory` to identify repository text references to the current product name, canonical domain, and SAT/PSAT marks. The inventory is informational and does not make legal determinations.

## Migration principles
1. Keep the product code, learner records, and content IDs independent from the public brand wherever possible.
2. Do not change the production domain, public indexing, billing, or campaign accounts until the replacement naming/domain has been approved.
3. Treat test names as descriptive third-party references, not as the product identity, subject to the final trademark guidance/legal review.
4. Preserve every security/privacy/billing launch lock during the transition.
5. Do not expose proprietary diagnostic content during a rebrand.
6. Validate every changed public page for canonical URLs, structured data, internal links, accessibility, and non-affiliation language before launch.

## Technical workstreams if a rebrand is approved

### 1. Brand configuration
Create a single configuration source for:
- Product display name.
- Primary domain and canonical origin.
- Support/legal contact identities.
- Social account handles only after account-creation approval.
- Default Open Graph site name.
- Email sender identity only after lifecycle-email approval.

Migrate runtime UI strings to this source where practical. Static SEO pages can be regenerated or systematically migrated after the final name/domain is known.

### 2. Canonical URL transition
Before public indexing:
- Change all canonical URLs and sitemap URLs to the approved origin.
- Update `robots.txt` sitemap reference.
- Update JSON-LD `url` and `@id` fields.
- Update Open Graph URLs.
- Update allowed-origin lists for server APIs.
- Update public-host billing gates so the replacement production host remains closed until billing approval.
- Update Supabase authentication redirect URLs only after the replacement host is ready and approved.

Because public indexing is currently globally blocked, a prelaunch domain change avoids most SEO migration cost. Do not intentionally index the current domain and then rebrand unless there is a documented reason.

### 3. Legacy-domain handling
If the current domain is retained after a rebrand for transition purposes:
- Keep it under company control.
- Redirect only after the replacement site is validated.
- Prefer permanent path-preserving redirects once the new origin is final.
- Do not redirect authentication callbacks, API requests, or billing webhooks blindly; migrate those explicitly.
- Maintain HSTS/security headers on both origins.

### 4. Product/application changes
Audit at least:
- `index.html`, `marketing.js`, `prelaunch-guard.js`, `billing.js`, and application navigation.
- Public SEO/trust pages under `public/`.
- `vercel.json` public-host behavior and security policy.
- Stripe success/cancel/portal URL construction.
- Supabase auth redirect/confirmation flows.
- Parent invitations and email-link URLs.
- Privacy/support/legal text.
- Marketing event allowed-origin logic.
- Structured data and sitemap generation/validation.

### 5. External accounts — approval required
Do not create or rename these autonomously:
- Google Search Console / Bing Webmaster.
- Google Ads / Microsoft Ads.
- Meta / TikTok / other social ad accounts.
- Social profiles.
- Email service/provider sender domains.
- Affiliate/referral platform accounts.
- Stripe public business descriptor or live-payment settings.

Create them only after the final brand/domain is approved.

## Verification before switching the launch gate
Run the full production build plus:

- `npm run brand:inventory`
- `npm run validate:seo`
- `npm run validate:marketing-claims`
- `npm run validate:accessibility`
- `npm run validate:security`
- `npm run validate:launch`

Then manually verify:
- No obsolete product-name references in customer-facing UI, public pages, metadata, structured data, or transaction emails.
- Canonical/sitemap URLs all use the approved origin.
- No unintended College Board affiliation or endorsement language.
- Auth, parent invite, billing-preview, password/confirmation, and support links use the correct origin.
- Cross-account isolation and privacy controls are unaffected.
- Public indexing, public billing, live payments, and outbound marketing remain disabled until their independent approvals are complete.

## Rollback
Before a domain/name cutover, record the last green commit and current environment configuration. If verification fails, revert application/domain changes while keeping the commercial launch gates disabled. Never use a failed rebrand migration as a reason to bypass security, privacy, or billing gates.
