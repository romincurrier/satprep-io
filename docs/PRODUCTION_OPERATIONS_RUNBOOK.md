# SATprep.io Production Operations Runbook

Updated: 2026-08-28

This runbook defines the operational response for the SATprep.io commercial release candidate and the first 72 hours after any future public launch. It does not authorize public billing, live payments, indexing, marketing measurement, outbound marketing, or activation of unreviewed content.

## Production identity

- Vercel team: `satprep-io-060ea753`
- Vercel team ID: `team_hBoexmKbWSzcVuRWBJFMv3VG`
- Vercel project: `satprep-io`
- Vercel project ID: `prj_QLwPuaOvy6uX58avixcTk6jaRDPp`
- Production domains: `www.satprep.io` and `satprep.io`
- Supabase project: `SATprep.io`
- Supabase project ref: `ataaiocpbjavmdpgmzlv`
- Production branch: `main`

Never troubleshoot against, restore, or migrate a different Supabase project as a substitute for the production project above.

## Current observability surfaces

### Vercel

Use the production project to inspect:

1. Latest Production deployment and commit SHA.
2. Build status and build logs.
3. Runtime error clusters for the production project.
4. Runtime logs scoped to Production, a deployment ID, status code, route, or request ID.
5. Firewall overview for unusual denies/challenges, while distinguishing Vercel system DDoS mitigation from application failures.

A green build proves compilation/build-time validation only. It does not prove that the browser can render the application successfully. Client-side render loops, stale browser state, or JavaScript failures can still break the public experience while Vercel reports the deployment as Ready.

### Supabase

Production log visibility is available for:

- `auth`: login, logout, token refresh/revocation, `/user`, request IDs and status codes.
- `api`: REST/Data API and RPC traffic, request paths and status codes.
- `postgres`: database errors, migration statements, connection/reset messages, and database engine events.
- `storage`: object/storage service requests and errors when activity exists.
- `realtime` and `edge-function`: inspect when the affected flow uses those services.

Supabase security and performance advisors are also part of release-candidate review, but advisor warnings are not substitutes for runtime logs.

### Known monitoring gap

There is not yet a dedicated first-party collection path for uncaught browser JavaScript exceptions/fatal rendering failures. Vercel runtime errors do not reliably capture purely client-side failures. Until a privacy-reviewed client-error strategy exists, browser rendering must be included in synthetic/manual release checks. Do not enable a third-party client telemetry product autonomously or send learner/account data to a new processor without owner/privacy approval.

## First 72 hours after public launch

This cadence starts only after explicit launch approval.

### First 2 hours

Every 15 minutes:

- Open `www.satprep.io` in a clean browser session and confirm the homepage renders.
- Confirm login surface opens.
- Inspect the current Vercel Production deployment and runtime error clusters.
- Inspect Vercel 5xx/runtime logs for newly failing application routes.
- Review Supabase Auth logs for abnormal login/token failures.
- Review Supabase API/Postgres logs for elevated 4xx/5xx/database errors.
- Review support/privacy queues for clustered reports.
- If billing has been explicitly launched, review Stripe webhook/checkout failure visibility separately.

### Remainder of launch day

At least hourly:

- Repeat the Vercel/Supabase checks above.
- Track authentication, onboarding, diagnostic start/completion, practice save/score failures, parent reporting failures, prior-report upload failures, and payment failures if live billing is approved.
- Compare failures with the launch-candidate commit/deployment ID before deciding on rollback.

### Days 2 and 3

At least every 4 hours while awake/on-call:

- Review Vercel runtime errors and elevated 5xx routes.
- Review Supabase Auth/API/Postgres/Storage logs.
- Review support incidents and content-error reports.
- Verify the public homepage and login path from a clean session.
- Review billing/webhook failures if billing is live.

Increase the cadence immediately when a SEV-1 or SEV-2 condition appears.

## Severity definitions

### SEV-1 — critical

Examples:

- Public site unavailable or persistently non-rendering for ordinary users.
- Broad authentication outage preventing account access.
- Confirmed cross-account learner/parent data exposure or authorization bypass.
- Confirmed exposure of proprietary answer keys/secure diagnostic content.
- Data corruption affecting trusted learner state.
- Widespread payment/entitlement failure after live billing is explicitly enabled.

Response:

- Stop any active acquisition or launch expansion immediately.
- Preserve evidence before making destructive changes.
- Identify the exact deployment/commit and whether the failure is client, Vercel, Supabase, or billing-side.
- Roll back application code only when the previous deployment is known-good and database compatibility is safe.
- For security/privacy exposure, prioritize containment over availability and escalate separately from ordinary support.

### SEV-2 — major

Examples:

- Core diagnostic/practice/onboarding flow broken for a meaningful subset of users.
- Repeated answer-save/finalization failures.
- Parent/student linking or progress reporting substantially broken.
- Prior-assessment uploads consistently failing.
- Security control degradation without confirmed exposure.

Response:

- Freeze non-essential releases.
- Isolate the affected route/role and compare with the previous production deployment.
- Apply a narrow fix or safe application rollback after compatibility review.
- Re-run the affected authorization/regression checks before restoring normal release activity.

### SEV-3 — degraded

Examples:

- Isolated feature failure with a workaround.
- Low-volume account/support problem.
- Non-core API error affecting a small subset of requests.

Response:

- Record the issue, affected role/route, timestamps and request IDs where available.
- Fix in the next controlled release unless the failure rate increases.

### SEV-4 — minor

Examples:

- Cosmetic/UI defect.
- Documentation/copy issue that does not misrepresent pricing, privacy, affiliation, or functionality.
- Minor accessibility defect not blocking task completion.

Response:

- Queue for normal maintenance unless it implicates a launch gate.

## Incident evidence to capture

For every SEV-1/SEV-2 incident, record:

- UTC and local start time.
- Production commit SHA.
- Vercel deployment ID/URL.
- Affected domain, route, API endpoint and user role.
- Vercel request ID/runtime error cluster where available.
- Supabase service, request ID and status/error where available.
- Whether the issue reproduces in a clean/incognito browser and on a second network/device when relevant.
- Whether the previous production deployment reproduces the issue.
- Whether a database migration preceded the incident.
- Exact remediation/rollback commit or migration.

Do not record passwords, full payment-card details, service-role credentials, Stripe secrets, session tokens, proprietary question text, or unnecessary learner personal data in the incident record.

## Rollback decision rules

### Application-only regression

A Vercel rollback is appropriate when all are true:

1. The failure began with a clearly identified application deployment.
2. The prior deployment is known-good for the affected flow.
3. Database/schema changes made since the prior deployment are backward-compatible with that older application version.
4. Rolling back will not re-enable a known security/privacy defect.

After rollback, verify homepage render, authentication, affected API route, and the relevant parent/student/admin authorization boundary.

### Database/RLS regression

Do not casually roll back production database migrations. Prefer a small forward migration when possible. Before and after any RLS correction:

- capture the exact policy command, role target, permissiveness, USING and WITH CHECK expressions;
- run the recorded administrator/parent/student/unrelated authorization-equivalence checks appropriate to the table;
- run Supabase security/performance advisors;
- commit the production state back into the repository with a regression guard.

If a migration causes confirmed data exposure, containment takes priority and a safe restrictive forward fix may be required immediately.

### Billing regression

Before live payments are explicitly approved, keep public billing/live-payment gates disabled. After future launch, if checkout, webhook or entitlement behavior becomes unsafe or unreliable, disable public billing/live-payment activation rather than attempting to make payments succeed by weakening ownership, signature, origin, idempotency, or entitlement checks.

### Client-rendering regression

A browser can fail even when Vercel reports `READY` and has no server runtime errors. Check, in order:

1. Reproduce in a clean/incognito session.
2. Test the direct Vercel deployment hostname if useful.
3. Inspect recently changed client bootstraps, MutationObservers, navigation/history loops, service workers, and synchronous render paths.
4. Compare with the previous deployment.
5. Add a regression/build guard for the failure pattern after fixing it.

The 2026-08-27 SATprep.io outage was caused by a self-triggering prelaunch `MutationObserver`: an unconditional observed DOM rewrite generated another mutation indefinitely. The repair made observed rewrites idempotent and the production build now rejects the unsafe unconditional rewrite pattern. Treat this as a standing regression lesson, not as evidence of Vercel/CDN failure.

## Release-candidate preflight

Immediately before requesting owner launch approval:

- Confirm `main` head and record the commit SHA.
- Confirm the corresponding Vercel Production deployment is Ready and assigned to `www.satprep.io`/`satprep.io`.
- Run the full production build validation.
- Run the release-candidate Supabase security and performance advisors.
- Review Vercel runtime errors/logs for recent production errors.
- Review Supabase Auth/API/Postgres/Storage logs for unexplained failures.
- Verify homepage rendering in a clean browser.
- Verify admin, parent and student role boundaries using production-equivalent synthetic accounts.
- Verify secure diagnostic/practice acceptance with independently reviewed content before trusting those launch paths.
- Verify public billing, live payments, indexing, measurement and outbound marketing remain disabled until their explicit owner approvals.

## Backup and restore

Database backup/PITR capability is intentionally not declared complete in this runbook. It must be confirmed against the actual Supabase plan and project backup settings before commercial launch. Do not perform a destructive restore on production merely to prove that a restore is possible. The acceptance method should use documented plan capability plus a non-destructive or isolated recovery exercise.

## Ownership and escalation

Before commercial launch, assign named owners for:

- application/hosting incidents;
- Supabase/database/storage incidents;
- authentication/access incidents;
- billing/refund incidents;
- content-quality incidents;
- privacy/security incidents.

Security/privacy incidents must remain a separate escalation path from ordinary customer support. Support personnel must never request user passwords or full payment-card details.
