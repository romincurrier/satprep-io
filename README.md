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

## Hostinger GitHub deployment

Hostinger should detect Vite / Node automatically.

Recommended settings if Hostinger asks:
- Node version: 20 or 22
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Entry file: `server.js`
- Start command: `npm start`

Add these environment variables in Hostinger:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. In Authentication settings, enable Email/Password.
5. Add `https://satprep.io` as the Site URL and allowed redirect URL.
6. Copy the Project URL and anon/public key into Hostinger environment variables.
7. Redeploy the Hostinger application.

## Initial admin

Create your account normally, then in Supabase SQL Editor run:

`update public.profiles set role='admin' where email='YOUR_EMAIL';`

## MVP parent linking

Until the admin linking screen is built, create both accounts, locate the UUIDs in Supabase, and insert:

`insert into public.parent_students(parent_profile_id,student_id) values ('PARENT_PROFILE_UUID','STUDENT_UUID');`

## Next development milestones

- Admin user management UI
- Parent/student linking workflow
- Uploaded score-report intake
- Full diagnostic engine
- Adaptive remediation rules
- Curriculum/question-bank database
- 2026–27 course expansion
- Benchmark and predicted-score engine
- Subscription/billing architecture
