# Backend Reconciliation Guard

Last checked: 2026-08-24

## Why this exists

The SATprep.io browser client is environment-driven and reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build/runtime. Server routes use server-side Supabase environment variables. The repository therefore does not hard-code the production project ref.

During active SATprep.io testing on 2026-08-23, the application was verified against Supabase project ref `ataaiocpbjavmdpgmzlv` and contained live parent, student, subscription, prior-assessment, diagnostic, and journey data.

During the autonomous overnight build on 2026-08-24, the currently connected Supabase management account exposed only project ref `nrjqykfrnfrgyuvprwob`, which is INACTIVE. That project must NOT be assumed to be the current SATprep.io application backend merely because it is the only project visible to the management connector.

## Hard rule

Do not restore, migrate, reset, seed, or otherwise mutate `nrjqykfrnfrgyuvprwob` as part of SATprep.io development unless its identity as the intended active backend is independently confirmed.

Before any hosted database migration is applied, verify all three of the following:

1. The project ref derived from the deployed `VITE_SUPABASE_URL` / server Supabase URL.
2. The expected SATprep.io schema and known test records are present.
3. The project is the same backend intentionally selected for the current deployment.

If management-connector visibility conflicts with deployment configuration, deployment configuration plus known application data wins for identification; pause and reconcile access rather than migrating the visible project blindly.

## Current safe development mode

Until the active project is visible to the connected Supabase management tool:

- Repository-side code, tests, validators, documentation, content architecture, SEO, marketing preparation, accessibility, and security hardening may continue.
- Database migrations may be authored and committed but must be considered pending/not live.
- No inactive Supabase project should be restored automatically.
- No production data should be copied, recreated, or guessed in another project.

## Deployment state

The latest checked main-branch commit was successfully accepted by Vercel after a transient failed deployment during the overnight sequence. Continue to verify the GitHub/Vercel combined status for main before assuming new repository changes are live.
