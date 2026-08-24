# SATprep.io API Abuse-Control Policy

Status: pre-launch operating standard

## Purpose
SATprep.io handles proprietary assessment content, household/account changes, billing actions, and eventually privacy-minimized public-site measurement. Authentication and authorization are necessary but are not sufficient protections against automation, scraping, accidental request loops, stolen-session abuse, repeated privileged actions, or anonymous event flooding. Production APIs therefore require layered abuse controls.

## Current durable application-layer control
The pending `migrations/20260824_api_rate_limits.sql` migration adds a database-backed fixed-window limiter that is safe across Vercel serverless instances.

Design properties:
- counters are stored in Supabase rather than function memory, so limits survive cold starts and parallel instances;
- raw user IDs, email addresses, and network addresses are not stored in the limiter table; the server writes SHA-256 subject hashes;
- the counter table is not readable or writable by `anon` or `authenticated` browser roles;
- the consumption RPC is executable only by `service_role`;
- counter increments are atomic through an upsert;
- rejected requests return HTTP 429 plus `Retry-After`;
- if the durable limiter is unavailable, protected endpoints fail closed with HTTP 503 rather than silently running without the control;
- limiter calls opportunistically delete hashed counters older than 24 hours, keeping operational abuse-control data short-lived without requiring a separate scheduled cleanup job.

## Protected routes and initial limits
These limits are launch defaults and should be tuned using support and security data. They are not product promises.

| Route key | Protected action | Limit | Window |
| --- | --- | ---: | ---: |
| `diagnostic/session` | Open/create secure diagnostic session | 10 | 60 seconds |
| `diagnostic/item` | Deliver current secure diagnostic item | 40 | 60 seconds |
| `diagnostic/answer` | Submit diagnostic answer for server scoring | 40 | 60 seconds |
| `practice/session` | Open/resume secure guided-practice session | 20 | 60 seconds |
| `practice/item` | Deliver current guided-practice item | 60 | 60 seconds |
| `practice/answer` | Submit practice answer for server scoring/feedback | 80 | 60 seconds |
| `account/student-activation` | Parent creates a student login | 5 | 1 hour |
| `parent/invitations/read` | Parent reads pending invitations | 60 | 60 seconds |
| `parent/invitations/accept` | Parent accepts/link invitation | 10 | 1 hour |
| `parent/setup-request` | Under-13 parent setup request by normalized email | 3 | 1 hour |
| `billing/checkout-create` | Create Stripe checkout session | 10 | 1 hour |
| `billing/checkout-confirm` | Confirm Stripe checkout session | 30 | 1 hour |
| `billing/portal-create` | Create Stripe billing portal session | 20 | 1 hour |
| `marketing/event` | Submit privacy-minimized first-party public-site event when explicitly enabled | 60 | 60 seconds |

## Why diagnostic and practice limits matter
The secure-v3 diagnostic and guided-practice endpoints are intentionally sequential: the browser may request only the current unanswered question. Rate limiting adds a second control against scripted polling, answer-key harvesting, repeated scoring requests, and accidental request loops. It does not replace server-only scoring keys, session/attempt ownership checks, sequential-position enforcement, restrictive RLS, or content approval gates.

Practice answer limits are intentionally somewhat higher than diagnostic limits because guided practice legitimately returns feedback and may involve faster student pacing, retries around transient connectivity, and more frequent session interactions. They should still remain far below useful automated scraping throughput and must be tuned from controlled pilot data rather than guesswork.

## Why billing/account limits matter
Rate limiting reduces repeated creation of provider sessions and privileged account mutations. It does not replace:
- parent/billing-owner authorization;
- household ownership checks;
- Stripe metadata verification;
- sandbox/live-billing launch gates;
- unique constraints and idempotent persistence;
- parental-consent/privacy review.

## Public unauthenticated measurement
First-party marketing measurement has independent browser and server launch locks and remains disabled during prelaunch. The tracking module may be present in the built application, but it is inert unless the client launch gate is explicitly enabled; the receiving API independently returns 404 unless `MARKETING_MEASUREMENT_ENABLED=true` is configured server-side.

If measurement is approved later:
- the browser module operates only on public marketing surfaces, not authenticated `?app=1` or billing/checkout modes;
- requests are accepted only when an approved browser `Origin` is present;
- event names are allowlisted;
- payload size and field lengths are bounded;
- no cookie, localStorage identifier, account ID, learner ID, age/DOB, school, test score, diagnostic response, skill mastery, or uploaded assessment data is part of the event schema;
- email-like and phone-like campaign/referral values are discarded server-side rather than stored;
- Vercel's edge-provided `x-forwarded-for` value may be used transiently only as an abuse-control subject; the raw address is not inserted into `marketing_events` or `api_rate_limits`;
- `enforceRateLimit` SHA-256 hashes the route/subject before persistence, and stale hashed counters are pruned after approximately 24 hours;
- the event table remains service-role-write-only with no browser read/write policy.

Application throttling is still only one layer. Before broad public measurement or acquisition traffic is activated, configure and test platform firewall controls for volumetric attacks and obvious automated abuse. Do not turn public IP addresses into marketing attribution identifiers.

## Platform-layer launch gate
Before broad public launch, configure and test Vercel firewall/traffic controls for obvious automated abuse, volumetric spikes, and emergency blocking. Platform controls are an additional layer, not a substitute for route-specific authorization and durable application limits.

## Monitoring and tuning
After launch or a controlled pilot:
1. Track 429 counts by route key without exposing raw subject identifiers in dashboards.
2. Investigate unexpected spikes before raising limits.
3. Review false-positive support cases, especially accessibility/assistive-technology and household setup flows.
4. Keep diagnostic and practice item/answer limits comfortably above realistic human use while below useful scraping throughput.
5. Alert on repeated 503 failures from the rate-limit backend because protected routes intentionally fail closed.
6. Confirm stale limiter rows remain bounded by the opportunistic 24-hour cleanup behavior; if traffic is too low for reliable cleanup, add a separately approved maintenance job.
7. Review anonymous marketing-event volumes by route/event class rather than by network identity.

## Required pre-launch verification
- Apply `20260824_api_rate_limits.sql` after the Supabase project is intentionally active.
- Verify `anon` and `authenticated` cannot select/insert/update/delete `api_rate_limits` or execute `consume_api_rate_limit`.
- Verify service-role RPC calls return allowed/count/limit/reset time.
- Exercise each protected route below and above its limit in a non-production test account.
- Confirm 429 responses include `Retry-After` and contain no configuration details.
- Confirm limiter/backend failure produces 503 for protected routes.
- Exercise diagnostic and guided-practice session/item/answer routes separately so a tuning change to one flow does not silently weaken the other.
- With first-party measurement still disabled, confirm the browser does not send marketing events and `/api/marketing-event` returns 404.
- In a controlled non-public QA environment only, enable both measurement gates and verify allowlisted events work, authenticated/billing routes stay unmeasured, originless/cross-origin requests are rejected, contact-like campaign values are dropped, abusive traffic reaches 429, and no raw client address is stored.
- Run `npm run validate:security`, `npm run validate:launch`, and a complete production build.
- Re-run Supabase security and performance advisors after applying the migration.
