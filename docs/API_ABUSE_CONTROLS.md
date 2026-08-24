# SATprep.io API Abuse-Control Policy

Status: pre-launch operating standard

## Purpose
SATprep.io handles proprietary assessment content, household/account changes, and billing actions. Authentication and authorization are necessary but are not sufficient protections against automation, scraping, accidental request loops, stolen-session abuse, or repeated privileged actions. Production APIs therefore require layered abuse controls.

## Current durable application-layer control
The pending `migrations/20260824_api_rate_limits.sql` migration adds a database-backed fixed-window limiter that is safe across Vercel serverless instances.

Design properties:
- counters are stored in Supabase rather than function memory, so limits survive cold starts and parallel instances;
- raw user IDs and email addresses are not stored in the limiter table; the server writes SHA-256 subject hashes;
- the counter table is not readable or writable by `anon` or `authenticated` browser roles;
- the consumption RPC is executable only by `service_role`;
- counter increments are atomic through an upsert;
- rejected requests return HTTP 429 plus `Retry-After`;
- if the durable limiter is unavailable, protected privileged endpoints fail closed with HTTP 503 rather than silently running without the control.

## Protected routes and initial limits
These limits are launch defaults and should be tuned using support and security data. They are not product promises.

| Route key | Protected action | Limit | Window |
| --- | --- | ---: | ---: |
| `diagnostic/session` | Open/create secure diagnostic session | 10 | 60 seconds |
| `diagnostic/item` | Deliver current secure diagnostic item | 40 | 60 seconds |
| `diagnostic/answer` | Submit answer for server scoring | 40 | 60 seconds |
| `account/student-activation` | Parent creates a student login | 5 | 1 hour |
| `parent/invitations/read` | Parent reads pending invitations | 60 | 60 seconds |
| `parent/invitations/accept` | Parent accepts/link invitation | 10 | 1 hour |
| `parent/setup-request` | Under-13 parent setup request by normalized email | 3 | 1 hour |
| `billing/checkout-create` | Create Stripe checkout session | 10 | 1 hour |
| `billing/checkout-confirm` | Confirm Stripe checkout session | 30 | 1 hour |
| `billing/portal-create` | Create Stripe billing portal session | 20 | 1 hour |

## Why the diagnostic limits matter
The secure-v3 diagnostic endpoint is intentionally sequential: the browser may request only the current unanswered question. Rate limiting adds a second control against scripted polling and repeated scoring requests. It does not replace server-only answer keys, attempt ownership checks, sequential-position enforcement, restrictive RLS, or content approval gates.

## Why billing/account limits matter
Rate limiting reduces repeated creation of provider sessions and privileged account mutations. It does not replace:
- parent/billing-owner authorization;
- household ownership checks;
- Stripe metadata verification;
- sandbox/live-billing launch gates;
- unique constraints and idempotent persistence;
- parental-consent/privacy review.

## Public unauthenticated traffic
Marketing measurement remains intentionally gated and is not loaded by the production client while the privacy/measurement migration is pending. Before public marketing measurement is activated, add a separately reviewed public-ingress strategy that combines platform firewall controls with privacy-minimized application throttling. Do not persist raw client IP addresses solely for marketing attribution.

## Platform-layer launch gate
Before broad public launch, configure and test Vercel firewall/traffic controls for obvious automated abuse, volumetric spikes, and emergency blocking. Platform controls are an additional layer, not a substitute for route-specific authorization and durable application limits.

## Monitoring and tuning
After launch or a controlled pilot:
1. Track 429 counts by route key without exposing raw subject identifiers in dashboards.
2. Investigate unexpected spikes before raising limits.
3. Review false-positive support cases, especially accessibility/assistive-technology and household setup flows.
4. Keep diagnostic item/answer limits comfortably above realistic human use while below useful scraping throughput.
5. Alert on repeated 503 failures from the rate-limit backend because protected routes intentionally fail closed.
6. Purge old fixed-window counter rows under an approved retention job; counters are operational security data, not learner records.

## Required pre-launch verification
- Apply `20260824_api_rate_limits.sql` after the Supabase project is intentionally active.
- Verify `anon` and `authenticated` cannot select/insert/update/delete `api_rate_limits` or execute `consume_api_rate_limit`.
- Verify service-role RPC calls return allowed/count/limit/reset time.
- Exercise each protected route below and above its limit in a non-production test account.
- Confirm 429 responses include `Retry-After` and contain no configuration details.
- Confirm limiter/backend failure produces 503 for protected routes.
- Run `npm run validate:security` and a complete Vercel build.
- Re-run Supabase security and performance advisors after applying the migration.
