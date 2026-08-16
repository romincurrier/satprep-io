# SATprep.io

Adaptive multi-user SAT/PSAT preparation platform.

## What is in this repository

- Vite front end
- Express production server
- Supabase email/password authentication
- Student / parent / admin role foundation
- Student onboarding and learner profile
- Cloud lesson progress
- Question-attempt history
- Skill mastery tracking
- Mastery-gated lessons
- Cross-device resume through Supabase
- Initial first-week diagnostics and foundation lessons
- Supabase SQL schema with Row Level Security
- Parent household onboarding and billing flow
- Stripe test-mode subscription checkout integration
- Adaptive diagnostic engine
- Road to Test Day journey, XP, milestones, and achievements

## Local development

1. Copy `.env.example` to `.env`.
2. Add your Supabase project URL and anon key.
3. Run:
   `npm install`
4. Run:
   `npm run dev`

## Production build

`npm run build`
`npm start`

The Express server serves the Vite `dist` directory and listens on `process.env.PORT`.

## Deployment

Production is deployed through Vercel from the `main` branch.

Required public application environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Billing also uses server-side Stripe environment variables. Stripe secret credentials must never be committed to this repository or exposed to browser code.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run the required migrations/schema.
4. In Authentication settings, enable Email/Password.
5. Add `https://satprep.io` as the Site URL and allowed redirect URL.
6. Configure the Supabase environment variables in Vercel.
7. Redeploy the application after environment-variable changes.

## Initial admin

Create your account normally, then in Supabase SQL Editor run:

`update public.profiles set role='admin' where email='YOUR_EMAIL';`

## Current development priorities

- End-to-end Stripe test subscription lifecycle
- Student diagnostic expansion and adaptive difficulty
- Dynamic remediation and prerequisite mapping
- Journey missions, weekly goals, and celebrations
- Parent progress reporting and student invitations
- Curriculum/question-bank expansion
- Benchmark and predicted-score engine
