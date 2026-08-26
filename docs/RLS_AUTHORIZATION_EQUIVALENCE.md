# SATprep.io RLS Authorization-Equivalence Baseline

Updated: 2026-08-26

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

## Performance-change rule

Supabase currently reports RLS initialization-plan and multiple-permissive-policy warnings. Initialization-plan fixes may replace repeated `auth.uid()`/auth helper evaluation with the semantically equivalent `(select auth.uid())` pattern, but they must not change policy role targets, commands, ownership predicates, household/link predicates, or trusted server-only boundaries. Multiple permissive policies must not be merged or removed solely to silence a linter unless the resulting authorization truth table is proven equivalent.

For each proposed RLS performance migration:

1. Capture the affected policy definitions before the change.
2. Re-run the parent, student, administrator, and cross-household visibility assertions above.
3. Apply only the narrow policy-expression change.
4. Re-run the same assertions and compare results.
5. Re-run Supabase security and performance advisors.
6. Reject/roll back any change that expands or contracts access unexpectedly.
