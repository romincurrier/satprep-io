# SATprep.io autonomous commercial-readiness cycle — 2026-09-05 13:35Z

## Material launch-state change

The prior Supabase access blocker is **closed**. ChatGPT's authorized Supabase connection now exposes the correct production project `ataaiocpbjavmdpgmzlv` (`SATprep.io`), and the project reports `ACTIVE_HEALTHY`.

This document is the current-cycle addendum to `docs/COMMERCIAL_LAUNCH_CHECKLIST.md`. Any older checklist text stating that the connected Supabase surface exposes only the unrelated Marketing OS project is superseded by this verified state. The remaining rendered-family-pilot blocker is a **runner/tooling limitation**, not a Supabase-access blocker and not a product failure.

## Pre-change inspection

Before any write, the cycle inspected:

- GitHub `main` and the corresponding production Vercel deployment.
- `docs/COMMERCIAL_LAUNCH_CHECKLIST.md`, package build/launch guards, RLS equivalence documentation, and live/self-pilot implementation.
- Production Supabase schema, pilot enrollment state, commercial-content state, security advisor, and performance advisor.
- Private expansion question bank and advisory-review ledger.

Fresh staging checks confirmed **434** expansion questions remain `draft_unreviewed`, **0** are `production_approved=TRUE`, and **434/434** have advisory `pass_ai_qa` review. AI QA remains advisory only and is not independent human approval. The older separate 94-question bank was not discoverable through the current Drive search surface, so cross-bank screening remains open.

Fresh production checks confirmed `public.content_items` contains **0 rows / 0 active / 0 production-approved**. No proprietary content was imported, approved, activated, or published.

## Production family-pilot attempt

A fresh high-entropy one-time pilot enrollment was created solely for this commercial-readiness attempt, with synthetic-only metadata and a short expiry. The current Vercel connector/browser-fetch environment could not invoke the protected production self-pilot endpoint. No product assertion was inferred from that runner failure. The enrollment was immediately revoked, leaving **5/5 pilot enrollment rows revoked** and no open test capability.

The rendered parent signup → child creation → student activation → diagnostic → adaptive path → lesson/practice → mastery/Journey → parent progress → admin monitoring acceptance run therefore remains open as a **runner limitation**. It must not be represented as a product failure or as a passed rendered acceptance test.

## Contained RLS performance hardening

The highest-value safe production change available after the runner limitation was a read-only authorization-equivalent InitPlan optimization for the linked-parent diagnostic reader policies:

- `public.diagnostic_attempts.diagnostic_parent_read`
- `public.diagnostic_responses.diagnostic_response_parent_read`

Repository migration: `migrations/20260905_diagnostic_parent_read_rls_initplan.sql`.

Before-change authorization baseline for one existing linked learner:

- linked parent: **1 diagnostic attempt / 20 diagnostic responses** visible;
- unrelated authenticated learner: **0 / 0**;
- administrator: **1 / 20**.

The repository migration changed only repeated `auth.uid()` evaluation to `(select auth.uid())`. It did not change policy commands, roles, permissiveness, parent/student linkage predicates, `WITH CHECK`, grants, revokes, or service-only boundaries.

The migration was applied to production only after the corresponding Vercel production build completed successfully through the existing diagnostic, practice, adaptive-learning, trusted-learning, parent/admin, billing, launch, regression, pilot-output, and secret-boundary guards.

Post-change authorization checks exactly matched the baseline:

- linked parent: **1 / 20**;
- unrelated authenticated learner: **0 / 0**;
- administrator: **1 / 20**.

Both policies remain PERMISSIVE / default PUBLIC / SELECT with no `WITH CHECK`. A fresh performance-advisor pass no longer reports `auth_rls_initplan` for either changed parent-reader policy. Remaining RLS performance warnings were left untouched rather than consolidated or rewritten without equivalent authorization evidence.

## Security and hard gates

A fresh security-advisor pass found no new security regression. RLS-enabled/no-policy INFO notices remain expected for intentionally fail-closed service-only tables. The remaining actionable Supabase security warning is **Auth leaked-password protection disabled**; this remains a prelaunch hardening item.

All commercial hard gates remain closed:

- public indexing disabled;
- public billing disabled;
- live payments disabled;
- first-party marketing measurement disabled;
- outbound marketing disabled;
- unreviewed proprietary content inactive/unapproved;
- no external publishing or owner-only activation performed.

The final `trusted_learning_authority` migration was **not** applied because the required full secure-v3 rendered acceptance run has not yet passed.

## Remaining material launch blockers

1. Execute and pass the protected rendered family acceptance journey in a browser-capable production-equivalent runner.
2. Independent human review of commercial content, plus cross-bank screening/merge against the separate 94-question bank before any import/activation.
3. Enable and verify Supabase Auth leaked-password protection through an authorized management surface.
4. Continue contained RLS performance tranches only with before/after authorization-equivalence evidence and fresh advisors.
5. Complete Stripe test-mode regression, final manual browser/device/accessibility checks, legal/privacy owner review, operational/recovery acceptance, and explicit owner-controlled launch toggles.
