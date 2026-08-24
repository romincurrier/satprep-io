# SATprep.io Marketing Data Dictionary

Status: pre-launch measurement specification. This document defines what may be measured once the approved migration and privacy review are complete. It does not authorize analytics activation or data collection.

## Design rule
Public acquisition analytics should answer marketing questions without collecting learner-performance data. By default, marketing events must not contain names, email addresses, account/user/student IDs, DOB/age, school information, test scores, diagnostic answers, uploaded-assessment data, IP addresses stored by SATprep.io, or persistent browser identifiers.

## Anonymous public-site event schema
| Field | Type | Required | Example | Rule |
| --- | --- | --- | --- | --- |
| `occurred_at` | timestamp | server | `2026-08-24T04:00:00Z` | Generated server-side |
| `event_name` | enum | yes | `marketing_cta_click` | Must be allow-listed |
| `page_path` | path | yes | `/sat-study-plan/` | Path only; query string removed |
| `referrer_host` | host | no | `google.com` | Host only, no full referrer URL |
| `utm_source` | token | no | `google` | Lowercase stable source |
| `utm_medium` | token | no | `cpc` | Controlled naming |
| `utm_campaign` | token | no | `sat_fall_2026_parent_search` | No PII |
| `utm_content` | token | no | `headline_stop_guessing_v1` | Creative variant |
| `utm_term` | short text | no | paid keyword | Do not use for user-entered free text |
| `cta_key` | token | no | `hero_get_started` | Stable UI identifier |
| `section_key` | token | no | `pricing` | Stable page section identifier |

## Event definitions
### `marketing_page_view`
Emit once when an approved public marketing page loads.
Purpose: page-level traffic and campaign mix.
Do not emit inside authenticated learner dashboards.

### `marketing_cta_click`
Emit when a user intentionally clicks a tracked acquisition CTA.
Required additional field: `cta_key`.
Examples: `hero_get_started`, `parent_create_account`, `sat_plan_start`.

### `pricing_view`
Emit once when the pricing section becomes meaningfully visible.
Purpose: consideration funnel analysis.
Do not interpret this as purchase intent by itself.

### `signup_open`
Emit when the public signup UI is intentionally opened.
Purpose: landing-page → signup-start conversion.
No account identifier should be attached.

### `login_open`
Emit when the login UI is intentionally opened.
Purpose: distinguish returning-account navigation from new-user interest.

## Product events that should remain outside the anonymous marketing table initially
These are valuable funnel events but should be stored in the authenticated product system until a reviewed attribution bridge is designed:
- signup complete
- onboarding complete
- diagnostic start
- diagnostic complete
- first learning session complete
- trial start
- subscription start
- subscription cancel
- refund

The first-party marketing table should not be expanded with `student_id` merely to make attribution easier.

## Recommended privacy-reviewed attribution bridge
If later approved, use a one-time/random attribution token created before signup and redeemed once into an account-level attribution record. The bridge should store only campaign dimensions needed for reporting and should not copy learner scores or question-level data into marketing tables.

Suggested account-attribution fields:
- `account_id` or purchaser household ID (server-side only)
- first-touch source/medium/campaign
- last-non-direct source/medium/campaign
- first landing path
- attributed_at

Do not store the attribution token in public reports after it is redeemed. Do not use student performance to build advertising audiences.

## Funnel definitions
### Qualified landing visit
A public page view from a human session that is not an obvious internal/test route. Final bot filtering should be handled by the analytics stack/platform rather than by collecting more identity data in the app.

### Signup start
`signup_open` on a public marketing page.

### Account created
Authenticated product event; not part of anonymous marketing_events table.

### Activated learner
Recommended launch definition: learner profile complete + prior-testing decision complete + diagnostic started.

### Strong activation
Diagnostic completed.

### Value realization
First personalized learning session completed after diagnostic.

### Retained learner
A learner who completes recommended learning work in a later defined retention window, such as days 2–7 after activation. The exact window must be locked before comparing campaigns.

### Paid conversion
A successfully active paid subscription after payment confirmation. Refund/cancellation windows should be accounted for in commercial reporting.

## KPI formulas
- Landing CTA rate = marketing CTA clicks / qualified landing visits.
- Signup-start rate = signup opens / qualified landing visits.
- Diagnostic-start rate = diagnostic starts / completed signups.
- Diagnostic-completion rate = completed diagnostics / diagnostic starts.
- First-learning completion rate = first learning sessions completed / completed diagnostics.
- 7-day activation retention = activated learners returning for qualifying work in the defined window / activated learners.
- Trial-to-paid conversion = paid subscriptions / eligible trial starts.
- CAC = eligible acquisition spend / new paying customers attributed under the approved model.
- Cost per activated learner = eligible acquisition spend / activated learners.

Do not calculate conversion rates using mismatched date windows or mix cohort-based and event-date denominators without labeling the method.

## Campaign naming validation
Allowed token style: lowercase letters, digits, underscores, hyphens where needed. Avoid spaces and free-form human notes.

Examples:
- source: `google`
- medium: `cpc`
- campaign: `sat_fall_2026_parent_search`
- content: `parent_dashboard_v2`

Prohibited campaign parameter content:
- `john_smith`
- `student_12345`
- `1450_sat_score`
- `jupiter_high_school`
- an email address
- a phone number

## Reporting dimensions
Safe default aggregate dimensions:
- day/week/month
- landing page
- source
- medium
- campaign
- content variant
- CTA key
- section key

Authenticated product reporting may separately use:
- target exam
- grade band if privacy/legal review approves aggregate reporting
- activation state
- subscription plan

Never export question-level learner performance into ad-platform audience tools.

## Retention and deletion
Final retention periods require legal/privacy review. Engineering should support deletion by date range and should avoid building dashboards that depend on indefinite raw-event retention.

Recommended operational principle:
- retain raw anonymous marketing events only as long as needed for validated attribution/analysis;
- retain aggregated historical marketing reports longer when they no longer contain user-level records;
- document retention and deletion jobs before public launch.

## Data-quality checks
Before trusting marketing reporting, validate:
1. Events are allow-listed and unknown event names are rejected.
2. Query strings/fragments do not enter `page_path`.
3. Campaign fields are length-limited and sanitized.
4. No authenticated student pages emit anonymous marketing page-view events.
5. Internal/test environments can be excluded from production reports.
6. CTA keys remain stable through copy/UI changes.
7. Duplicate page-view behavior is understood and documented.
8. Timezone in reporting is explicit.
9. Campaign totals reconcile with ad-platform spend at the same reporting grain.
10. Conversion-event definitions are versioned when they materially change.

## Versioning
If activation or attribution definitions change, create a new metric version and preserve the prior definition in documentation. Do not silently redefine “activated learner” during a campaign and then compare before/after results as though the metric were unchanged.
