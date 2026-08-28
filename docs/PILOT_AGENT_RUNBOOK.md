# SATprep.io Synthetic Pilot Agent Runbook

Updated: 2026-08-28

## Purpose

The Pilot Agent system exercises SATprep.io with unmistakably synthetic family identities before real-family pilot testing. It is an administrator-only technical QA system. It does not activate commercial billing, public marketing, public indexing, or unreviewed proprietary content.

## Control center

While signed in with an administrator account, open `/pilot-control.html`.

The control center exposes five synthetic learner personas:

- Balanced middle
- Math strong / Reading and Writing developing
- Reading and Writing strong / Math developing
- Foundation learner
- Advanced learner

Each run creates a separate synthetic parent account, synthetic household, and synthetic student account. Test identities are marked at every available boundary:

- `profiles.is_test_account = true`
- `households.is_test_household = true`
- `students.is_test_student = true`
- `students.test_label` begins with `pilot-agent-v1:`
- Auth app metadata records `satprep_test_account=true` and `account_origin='pilot_agent'`
- synthetic emails use the reserved `example.com` domain
- diagnostic summaries contain `test_only=true`

## Current v1 journey

A successful run performs the following sequence:

1. Create and auto-confirm a synthetic parent Auth user through the server-only administrative Auth API.
2. Verify that the normal parent signup trigger created the household/profile boundary.
3. Mark the parent and household as test-only.
4. Create and auto-confirm a synthetic parent-authorized student Auth user.
5. Mark the student profile and learner row as test-only and link the learner to the synthetic household/parent.
6. Verify password authentication for both synthetic Auth identities server-side.
7. Create a tracked `test_runs` full-journey record.
8. Run a deterministic 20-item synthetic diagnostic simulation (10 Reading and Writing, 10 Math) using repository-internal QA fixture content.
9. Persist synthetic diagnostic responses, mastery observations, diagnostic completion, and the resulting recommended-path state.
10. Select two of the synthetic learner's weakest measured skills.
11. Run up to five repository-internal staged practice items for each selected skill.
12. Persist synthetic attempts/progress/mastery and log test events.
13. Mark the pilot run complete and expose the result in the Pilot Control Center.

The deterministic persona model intentionally produces different response patterns for different learner profiles, including section-specific strengths/weaknesses and a modest difficulty penalty. This is for workflow/adaptive-state verification, not psychometric calibration.

## Content boundary

Pilot v1 does **not** use or modify the server-only commercial content tables. It must not read/write:

- `content_items`
- `content_answer_keys`
- `content_item_reviews`

It does not set `production_approved`, import a staged question, or activate any unreviewed proprietary content. Diagnostic and practice simulation uses repository-internal QA fixture banks only and applies only to records marked as synthetic test learners.

This means a successful v1 agent run verifies synthetic account creation, authentication, data flow, adaptive-state updates, and pilot telemetry. It does **not** satisfy the separate launch requirement for full browser/API secure-v3 acceptance against independently reviewed commercial content.

## Billing boundary

Pilot v1 does not create Stripe customers, subscriptions, checkout sessions, portal sessions, or fabricated provider IDs. Live payments and public billing remain disabled. Billing acceptance remains a separate Stripe test-mode launch workstream.

## Security controls

- Pilot run and delete mutations require an authenticated administrator.
- Mutation requests require verified same-origin browser requests.
- Pilot endpoints are rate-limited.
- The control page independently requires administrator role.
- Pilot credentials are generated and used only on the server and are never returned to the browser UI.
- `/pilot-control.html` has an explicit `noindex,nofollow,noarchive` directive.
- Production builds run `validate:pilot-agents` and fail if synthetic identity flags, admin boundaries, content isolation, or protected launch gates are weakened.

## Cleanup

The Pilot Control Center can remove an individual synthetic family. Cleanup succeeds only when the learner and household both verify as pilot/test records. It removes the synthetic Auth identities and test household/student data while retaining historical `test_runs` / `test_events` telemetry for QA evidence.

## What remains for browser-level acceptance

The v1 agent performs server-side account/auth verification and production data-flow simulation. It does not yet drive a headless browser through every screen. Browser-level acceptance remains a separate layer and should verify:

- public parent signup UI and email-confirmation experience;
- parent dashboard and student creation UX;
- student login and learner-profile UX;
- secure-v3 diagnostic UI, refresh/resume, new-device resume, and fault recovery;
- guided-practice UI and instructional feedback;
- parent progress UI after student activity;
- keyboard, screen-reader, browser, mobile, and tablet behavior.

Do not mark full commercial browser acceptance complete until that layer runs against the reviewed commercial content path.

## Commercial hard gates

Building or running synthetic pilot agents does not authorize or enable:

- live payments;
- public billing;
- public indexing;
- first-party marketing measurement;
- outbound marketing;
- external publishing;
- approval/import/activation of unreviewed proprietary content.
