# Backend Reconciliation Guard

Last checked: 2026-08-26

## Why this exists

The SATprep.io browser client is environment-driven and reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build/runtime. Server routes use server-side Supabase environment variables. The active production backend must therefore be verified from deployment configuration and live schema rather than inferred from whichever project happens to be visible in a management account.

## Verified production backend

As of 2026-08-26, the connected Supabase management tooling can directly access production project ref `ataaiocpbjavmdpgmzlv`.

A live read-only reconciliation query against that exact project confirmed the expected SATprep.io production schema is present, including `public.content_items`, `public.practice_sessions`, and `public.diagnostic_attempts`. The production content table currently contains zero rows and therefore zero active production-approved proprietary items, which is consistent with the independent-review launch gate.

The previously visible project ref `nrjqykfrnfrgyuvprwob` remains a retired/inactive backend and must not be used for current SATprep.io production work. Its origin has been removed from the production Content Security Policy.

## Hard rule

Do not restore, migrate, reset, seed, or otherwise mutate `nrjqykfrnfrgyuvprwob` as part of SATprep.io development unless its role is explicitly re-established by the owner in the future.

Before any hosted database migration is applied, verify all three of the following:

1. The target project ref is exactly `ataaiocpbjavmdpgmzlv` unless a deliberate backend migration has been approved.
2. The expected SATprep.io schema is present on the target.
3. The migration is represented in the repository and is appropriate for the currently deployed application contract.

## Current safe development mode

Production database changes may now be inspected and, when technically safe and represented by repository migrations, applied directly to `ataaiocpbjavmdpgmzlv`. Continue to preserve all commercial launch gates and content-review requirements.

- Repository code, tests, validators, documentation, content architecture, accessibility, security hardening, and acceptance infrastructure may continue.
- Proprietary content must remain staged/unapproved until independent review is complete.
- Do not copy or recreate production data into the retired project.
- Prefer reversible, additive migrations for performance hardening until final end-to-end acceptance is complete.

## Deployment state

GitHub commit status remains the authoritative automated deployment signal when direct Vercel management access is unavailable. The production repository's latest checked main-branch commit before this reconciliation had a successful Vercel status. Direct Vercel connector access returned a permissions error, so deployment verification should continue through the GitHub/Vercel commit status until that access path changes.

## Production CSP guard

`vercel.json` now permits Supabase browser connectivity only to the active production HTTPS/WSS host `ataaiocpbjavmdpgmzlv.supabase.co`; the retired host is not permitted. `scripts/validate-deployment-security.mjs` is part of the production build and fails if the retired Supabase host returns, the active production host is missing, Supabase connectivity is broadened to a wildcard, or prelaunch browser controls such as `noindex` are removed prematurely.
