# SATprep.io

Adaptive SAT/PSAT preparation platform with student, parent, billing, prior-assessment, diagnostic, learning, progress, content-QA, SEO, and pre-launch marketing foundations.

## Product architecture

- Vite browser application deployed through Vercel.
- Vercel serverless API routes under `api/` for privileged operations.
- Supabase authentication, PostgreSQL data, Row Level Security, and private assessment storage.
- Stripe test-mode subscription and customer-portal integration.
- Evidence-aware diagnostic and learning model.
- Secure-v3 diagnostic: proprietary answer keys remain server-side and diagnostic questions do not reveal correctness/explanations while the baseline assessment is in progress.
- Learning/practice sessions use a separate practice bank and show correctness, correct answer, and instructional explanation after submission.
- Prior-assessment ingestion for PDF and spreadsheet reports, with native score types preserved.
- Student, parent, admin, onboarding, learning, mastery, roadmap, and billing experiences.
- Static SEO/trust pages plus build-time SEO validation.
- First-party, privacy-minimized marketing measurement design that remains gated until privacy review and its migration are complete.

## Development status

The repository is a **pre-launch commercial candidate**, not a declaration that SATprep.io is ready for public paying customers. See `OVERNIGHT_STATUS.md` and `docs/COMMERCIAL_LAUNCH_RUNBOOK.md` for current launch blockers and gates.

Important content rule: question counts and automated validators do not make content production-ready. Independent human review is required, and approvals are pinned to the exact content hash so later edits invalidate the approval.

## Local development

1. Copy `env.example` to `.env` and provide the required development credentials.
2. Run `npm install`.
3. Run `npm run dev`.

Never commit service-role, Stripe secret, webhook, or other server secrets.

## Production validation and build

Run:

```bash
npm run build
```

The build executes, in order:

1. `npm run validate:content`
2. `npm run validate:approvals`
3. `npm run validate:seo`
4. `npm run validate:security`
5. Vite production compilation

Additional commercial-content commands:

```bash
npm run content:readiness
npm run content:review-export
npm run content:review-validate -- <completed-review-file>
npm run content:review-apply
```

Use `npm run content:readiness -- --strict` for a launch-depth gate. A strict pass is still not a substitute for psychometric calibration, legal/privacy review, or end-to-end production testing.

## Content review workflow

The source content bank remains original SATprep.io material. Do not copy or scrape protected College Board questions into the proprietary bank.

The independent review workflow is documented in `docs/CONTENT_REVIEW_RUNBOOK.md`:

1. Export the current candidate content.
2. Independently review accuracy, SAT/PSAT alignment, editorial quality, bias/accessibility, and originality.
3. Validate the completed review file.
4. Revise/reject problem items and re-review changed content.
5. Apply approved items to `content-approval-registry.json`.
6. Build validation verifies the SHA-256 hash of every approved item; a later content edit invalidates its approval.

## Supabase setup and migrations

The browser uses only the Supabase publishable/anon credential. Server-side privileged operations use server environment credentials through Vercel API routes.

Repository migrations are under `migrations/`. Before applying migrations to a production project:

1. Confirm the intended Supabase project/ref.
2. Confirm the project is active.
3. Reconcile already-applied migrations.
4. Apply pending migrations in order.
5. Re-run Supabase security and performance advisors.
6. Run the production smoke/regression checklist in `docs/COMMERCIAL_LAUNCH_RUNBOOK.md`.

Do not activate/restore hosted infrastructure merely to make a test pass if doing so may change billing or operating state without approval.

## Secure diagnostic design

New diagnostic attempts use the secure-v3 route. The server owns the question plan and scoring key. The browser receives only the safe prompt payload and answer choices. The secure diagnostic:

- enforces the next unanswered position;
- saves after every submission;
- supports resume after refresh/new window/device sign-in;
- is idempotent against duplicate submission;
- does not return correctness or explanations during the baseline assessment;
- uses server-side scoring;
- is designed so secure-v3 response records are blocked from direct authenticated-browser access by a restrictive RLS migration.

Existing legacy attempts are allowed to finish on their saved question plan to preserve user progress.

## Deployment

Vercel deploys the `main` branch. A green Vercel build means build-time checks passed; it does **not** by itself authorize a public commercial launch.

Public browser environment variables include the Supabase URL and publishable/anon credential. Server-only environment variables include the Supabase service-role credential and Stripe secrets. Never expose server-only variables through `VITE_` names or client code.

## Commercial launch documentation

- `OVERNIGHT_STATUS.md` — current implementation status and open launch gates.
- `docs/COMMERCIAL_LAUNCH_RUNBOOK.md` — full release, regression, billing, privacy, security, support, and monitoring checklist.
- `docs/CONTENT_AUTHORING_STANDARD.md` — content construction requirements.
- `docs/CONTENT_REVIEW_RUNBOOK.md` — independent content QA and hash-pinned approval workflow.
- `docs/PRIVACY_LAUNCH_CHECKLIST.md` — privacy/youth-data engineering and legal-review checklist.
- `docs/SEO_CONTENT_MATRIX.md` — organic search architecture and content backlog.
- `docs/MARKETING_OPERATING_PLAN.md` — funnel/channel/measurement strategy.
- `docs/MARKETING_ASSET_MATRIX.md` — campaign, paid-search, lifecycle, social, partnership, referral, and creative asset matrix.
- `docs/MARKETING_DATA_DICTIONARY.md` — privacy-minimized event and KPI definitions.

## Launch controls

The repository may prepare infrastructure and assets, but the following remain explicit approval gates:

- live Stripe activation or public pricing changes;
- restoring/starting infrastructure when billing/operational state may change;
- final privacy/terms publication;
- Search Console, ad, email, affiliate, social, or partner account activation;
- paid-media spend;
- outbound prospect/partner email;
- behavioral advertising/retargeting;
- referral rewards;
- use of real student outcomes, testimonials, uploaded reports, or identifiable screenshots.

## Current highest priorities

1. Intentionally activate/verify the production database and apply pending migrations.
2. Run secure-v3 end-to-end diagnostic and cross-device resume tests against the live schema.
3. Complete independent human content review and apply hash-valid approvals.
4. Expand diagnostic/practice depth and question rotation toward strict launch targets.
5. Finish API abuse/rate-limit and production RLS review.
6. Complete full student/parent/admin/billing/onboarding regression.
7. Complete privacy/legal/data-retention/support launch gates.
8. Finish SEO content cluster and approved measurement implementation before public acquisition.
