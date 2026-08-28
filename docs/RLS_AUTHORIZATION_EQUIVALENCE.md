# SATprep.io RLS Authorization-Equivalence Baseline

Updated: 2026-08-28

Purpose: preserve the current parent/student/admin isolation semantics while optimizing Supabase RLS policies. No RLS performance migration should be accepted unless these invariants are re-run against the production-equivalent schema before and after the change and the results are equivalent.

## Baseline verified against production

The checks below were executed with PostgreSQL `SET LOCAL ROLE authenticated` plus the corresponding authenticated user identity, inside non-destructive transactions. No application data was changed.

### Parent

- Sees only the parent's own profile through ordinary profile RLS.
- Sees the linked/household student and does not see an unrelated student.
- Sees the linked student's diagnostic attempt and does not see an unrelated student's attempt.
- Sees the linked student's trusted mastery and lesson-progress rows.
- Sees the parent/student relationship row for that parent.
- A direct parent update against the linked student's diagnostic attempt affects zero rows; parent diagnostic access is read-only.

### Student

- Sees only the student's own profile through ordinary profile RLS.
- Sees the student's own learner row and does not see another learner row.
- Sees the student's own diagnostic attempt and does not see another learner's attempt.
- Does not see parent/student relationship rows merely because the learner is linked to a parent.
- Sees the student's own mastery and lesson-progress rows.

### Administrator

- The administrator role can see the complete current profile, student, parent-link, diagnostic-attempt, mastery, and lesson-progress sets through the existing admin policies.

### Anonymous

- Anonymous access is not part of the authenticated learner/parent data contract. Current public-table policy evaluation can fail closed when an anonymous request reaches a policy that references the intentionally restricted `is_admin()` helper. Do not broaden anonymous grants merely to eliminate that error; public application routes should avoid direct anonymous reads of authenticated learner data.

## Secure-v3 invariants that must remain true

- Parent access is household/link scoped and never grants cross-household learner access.
- Student access is self scoped and never grants another learner's data.
- Secure-v3 diagnostic answer submission remains service mediated and sequence checked.
- Secure-v3 proprietary content, answer keys, persisted diagnostic plan items, and secure practice response stores remain unavailable to browser roles.
- Parent reporting is read-only with respect to trusted learning state.
- The final `trusted_learning_authority` migration is expected to intentionally reduce legacy browser write authority to `skill_mastery`, `lesson_progress`, and legacy attempt tables; that future reduction is not an equivalence-preserving RLS optimization and must be accepted/tested as a separate launch gate.

## Production equivalence log — 2026-08-28

Three additional InitPlan-only tranches were verified and applied to production without changing role targets, policy commands, permissiveness, or authorization predicates.

- `test_tables_admin_rls_initplan`: the exact profile-backed administrator predicate for `admin_test_runs_all` and `admin_test_events_all` evaluated true for the administrator identity and false for parent and student identities before and after the rewrite. Both policies remain PERMISSIVE, default PUBLIC, `ALL`, with the same predicate in `USING` and `WITH CHECK`; only `auth.uid()` evaluation changed to `(select auth.uid())`.
- `subscriptions_read_rls_initplan`: for the two changed SELECT policies, the parent retained exactly one authorized subscription row, while the tested administrator and student identities retained zero rows through those changed reader predicates before and after. The separate `subscription_admin_all` policy was untouched. `subscription_self_read` remains profile-self scoped, and `subscription_household_billing_owner_read` remains household + billing-owner scoped; only `auth.uid()` evaluation changed to `(select auth.uid())`.
- `journey_events_read_rls_initplan`: because `journey_events` currently has no production rows, equivalence was tested against the exact ownership/link predicates using the current linked parent, linked learner, unrelated learner, and administrator identities. Before and after, the linked parent predicate was true only for the linked learner, each student-self predicate was true only for that student's own learner row, and unrelated combinations remained false. The separate `journey_event_admin_all` policy was untouched. Both changed reader policies remain PERMISSIVE, default PUBLIC, `SELECT`, with no `WITH CHECK`; only `auth.uid()` evaluation changed to `(select auth.uid())`.

Fresh Supabase performance-advisor passes report no `auth_rls_initplan` findings for `public.test_runs`, `public.test_events`, `public.subscriptions`, or `public.journey_events`. Fresh security-advisor review is required after every production RLS tranche and must show no authorization/security regression before the tranche is considered complete.

## Performance-change rule

Supabase currently reports RLS initialization-plan and multiple-permissive-policy warnings. Initialization-plan fixes may replace repeated `auth.uid()`/auth helper evaluation with the semantically equivalent `(select auth.uid())` pattern, but they must not change policy role targets, commands, ownership predicates, household/link predicates, or trusted server-only boundaries. Multiple permissive policies must not be merged or removed solely to silence a linter unless the resulting authorization truth table is proven equivalent.

For each proposed RLS performance migration:

1. Capture the affected policy definitions before the change.
2. Re-run the parent, student, administrator, and cross-household visibility assertions above.
3. Apply only the narrow policy-expression change.
4. Re-run the same assertions and compare results.
5. Re-run Supabase security and performance advisors.
6. Reject/roll back any change that expands or contracts access unexpectedly.
