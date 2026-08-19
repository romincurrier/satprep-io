# SATprep.io MVP 1 Completion Standard

MVP 1 is a testable end-to-end product, not a mockup.

## Core user journey
- Public marketing homepage with clear free-trial CTA and sign-in path.
- Parent registration, email verification, household creation, and duplicate-email handling.
- Parent adds one student by default; additional students only appear on request.
- Stripe sandbox checkout supports Individual Monthly/Annual and Family Monthly/Annual plans with a 14-day trial.
- Subscription state persists in Supabase and can be managed through Stripe Billing Portal.
- Parent can activate an existing child's student login without creating a duplicate student record.
- Student can sign in independently under the parent's household authorization.
- Student completes learner profile and 16-question Math + Reading/Writing diagnostic.
- Diagnostic persists responses, mastery, recommended path, and immediate results.
- Student receives an adaptive learning path and can complete lessons/questions with progress persistence.
- Road to Test Day displays XP, stages, milestones, achievements, and next mission.
- Parent dashboard reports student setup, diagnostic status, progress, mastery, recent accuracy, and next step.
- Mobile and desktop experiences remain usable and clear.

## MVP 1 quality gates
- No dead ends in onboarding, billing, student activation, diagnostic, lessons, or account management.
- Every successful irreversible/important action has an explicit confirmation state.
- Errors are user-readable and do not expose secrets or internal stack traces.
- Existing child/student records are never duplicated during login activation.
- Subscription entitlement is checked server-side for privileged household actions.
- Parent/student/admin permissions are enforced server-side or with database RLS, not only hidden in UI.

## Security launch gate (required before public launch)
- Review RLS and policies for every public table and storage resource.
- Verify cross-household isolation for parent and student accounts.
- Verify student cannot elevate role or access parent billing/admin data.
- Verify parent cannot access unrelated students/households.
- Verify admin authorization and SECURITY DEFINER functions.
- Remove/minimize account-enumeration surfaces.
- Enable leaked-password protection and appropriate Auth protections.
- Audit API authorization, rate limiting, CORS/origin assumptions, session handling, and input validation.
- Confirm service-role key is server-only and never bundled to browser code.
- Confirm Stripe secret/webhook verification, replay/idempotency, sandbox/live separation, and billing entitlement behavior.
- Review minor/parental-consent workflow and privacy/data-retention requirements before collecting production minor data.
- Remove or restrict diagnostic/test-only endpoints and data.
- Run Supabase security advisors with no unresolved critical findings.
- Run final production smoke tests before opening public registration.

## Current focus
1. Student login activation and parent authorization.
2. Student first-login/profile experience.
3. Diagnostic -> recommended path -> Road to Test Day integration.
4. Lesson completion/progress persistence and parent visibility.
5. Admin/test controls and full end-to-end regression.
6. Security hardening and production launch review.
