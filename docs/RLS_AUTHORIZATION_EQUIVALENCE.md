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

Ten additional InitPlan-only tranches were verified and applied to production without changing role targets, policy commands, permissiveness, or authorization predicates.

- `test_tables_admin_rls_initplan`: the exact profile-backed administrator predicate for `admin_test_runs_all` and `admin_test_events_all` evaluated true for the administrator identity and false for parent and student identities before and after the rewrite. Both policies remain PERMISSIVE, default PUBLIC, `ALL`, with the same predicate in `USING` and `WITH CHECK`; only `auth.uid()` evaluation changed to `(select auth.uid())`.
- `subscriptions_read_rls_initplan`: for the two changed SELECT policies, the parent retained exactly one authorized subscription row, while the tested administrator and student identities retained zero rows through those changed reader predicates before and after. The separate `subscription_admin_all` policy was untouched. `subscription_self_read` remains profile-self scoped, and `subscription_household_billing_owner_read` remains household + billing-owner scoped; only `auth.uid()` evaluation changed to `(select auth.uid())`.
- `journey_events_read_rls_initplan`: because `journey_events` currently has no production rows, equivalence was tested against the exact ownership/link predicates using the current linked parent, linked learner, unrelated learner, and administrator identities. Before and after, the linked parent predicate was true only for the linked learner, each student-self predicate was true only for that student's own learner row, and unrelated combinations remained false. The separate `journey_event_admin_all` policy was untouched. Both changed reader policies remain PERMISSIVE, default PUBLIC, `SELECT`, with no `WITH CHECK`; only `auth.uid()` evaluation changed to `(select auth.uid())`.
- `student_achievements_read_rls_initplan`: production contains four achievement rows for the linked learner. Before and after the InitPlan-only rewrite, the linked parent predicate returned 4 rows, the linked student-self predicate returned 4 rows, and an unrelated student identity returned 0 rows through both changed reader predicates. `achievement_parent_read` and `achievement_student_read` remain PERMISSIVE, default PUBLIC, `SELECT`, with the same linked-parent/student-self predicates. The separate `achievement_admin_all` policy and authenticated-only `achievement_student_insert` policy were intentionally untouched.
- `student_missions_read_rls_initplan`: `student_missions` currently has no production rows, so equivalence was tested against the exact linked-parent and learner-self policy predicates using the current linked parent/student relationship and an unrelated learner target. Before and after, the linked parent predicate was true only for the linked learner, the linked student's self predicate was true only for the student's own learner row, and cross-account/unrelated combinations remained false. `mission_parent_read` and `mission_student_read` remain PERMISSIVE, default PUBLIC, `SELECT`, with no `WITH CHECK`; only `auth.uid()` evaluation changed to `(select auth.uid())`. The separate `mission_admin_all`, `mission_student_insert`, and `mission_student_update` policies were intentionally untouched.
- `weekly_goals_read_rls_initplan`: `weekly_goals` currently has no production rows, so equivalence was tested against the exact linked-parent and learner-self predicates using the current linked parent/student relationship plus an unrelated learner target. Before and after, the linked-parent predicate remained true only for the linked learner, each student-self predicate remained true only for that student's own learner row, and all unrelated/cross-account combinations remained false. `weekly_goal_parent_read` and `weekly_goal_student_read` remain PERMISSIVE, default PUBLIC, `SELECT`, with no `WITH CHECK`; only `auth.uid()` evaluation changed to `(select auth.uid())`. The separate `weekly_goal_admin_all`, `weekly_goal_student_insert`, and `weekly_goal_student_update` policies were intentionally untouched.
- `parent_rewards_student_read_rls_initplan`: `parent_rewards` currently has no production rows, so equivalence was tested against the exact learner-self predicate using both current student identities plus the linked parent identity. Before and after, each student identity matched only its own learner row (self 1→1, cross-account 0→0), while the parent identity did not match the changed student-reader predicate for either the linked or unrelated learner target (0→0). `reward_student_read` remains PERMISSIVE, default PUBLIC, `SELECT`, with the same learner-self predicate and no `WITH CHECK`; only `auth.uid()` evaluation changed to `(select auth.uid())`. The separate `reward_admin_all` and `reward_parent_all` ALL/write policies were intentionally untouched.
- `parent_invitations_student_read_rls_initplan`: production contains three parent-invitation rows. The exact changed student-self reader predicate was evaluated before and after against the current administrator, parent, and two student identities. The administrator remained 0→0, the parent remained 0→0, the student with no invitation rows remained 0→0, and the invitation-owning student retained exactly 3→3 matching rows. `student_invite_read` remains PERMISSIVE, default PUBLIC, `SELECT`, with the same `student_profile_id` self predicate and no `WITH CHECK`; only `auth.uid()` evaluation changed to `(select auth.uid())`. The separate `admin_invite_all` and `student_invite_insert` policies were intentionally untouched.
- `student_journey_read_rls_initplan`: production contains one `student_journey` row for the linked learner. Before and after the read-only InitPlan rewrite, the linked parent retained exactly 1 row through `journey_parent_read`, the linked student retained exactly 1 row through `journey_student_read`, and the unrelated student retained 0 rows through both changed reader predicates. The administrator did not gain rows through either changed reader predicate (0→0); administrator access remains governed by the separate `journey_admin_all` policy. Both reader policies remain PERMISSIVE, default PUBLIC, `SELECT`, with their linked-parent/student-self predicates unchanged. The separate authenticated `journey_student_insert` and `journey_student_update` write policies were intentionally untouched.
- `parental_consents_reader_rls_initplan`: production contains one parental-consent row. The exact `consent_parties_read` predicate was evaluated before and after against the current administrator, linked parent, consent-owning student, and unrelated student identities. The administrator remained 0→0 through the changed reader predicate, the linked parent retained exactly 1→1 row, the consent-owning student retained exactly 1→1 row, and the unrelated student remained 0→0. `consent_parties_read` remains PERMISSIVE, default PUBLIC, `SELECT`, with no `WITH CHECK` and the same parent-or-student-party predicate; only `auth.uid()` evaluation changed to `(select auth.uid())`. The separate `admin_consent_all` ALL policy and `parent_consent_insert` INSERT policy were intentionally untouched.

Fresh Supabase performance-advisor passes report no `auth_rls_initplan` findings for `public.test_runs`, `public.test_events`, `public.subscriptions`, `public.journey_events`, the two changed `public.student_achievements` reader policies, the two changed `public.student_missions` reader policies, the two changed `public.weekly_goals` reader policies, `public.parent_rewards.reward_student_read`, `public.parent_invitations.student_invite_read`, the two changed `public.student_journey` reader policies, or `public.parental_consents.consent_parties_read`. The separate student write-policy InitPlan warnings on `student_achievements`, `student_missions`, `weekly_goals`, and `student_journey` remain intentionally deferred; `parent_rewards.reward_parent_all` remains intentionally deferred because it is an ALL/write boundary; the separate `parent_invitations` administrator ALL and student INSERT InitPlan warnings remain intentionally deferred; and the separate `parental_consents` administrator ALL and parent INSERT InitPlan warnings remain intentionally deferred outside these read-only tranches. A fresh security-advisor pass after `parental_consents` hardening reports no new executable RLS/security regression. The only actionable security warning remains disabled Supabase Auth leaked-password protection; RLS-enabled/no-policy notices remain informational for intentionally fail-closed service-only tables.

## Performance-change rule

Supabase currently reports RLS initialization-plan and multiple-permissive-policy warnings. Initialization-plan fixes may replace repeated `auth.uid()`/auth helper evaluation with the semantically equivalent `(select auth.uid())` pattern, but they must not change policy role targets, commands, ownership predicates, household/link predicates, or trusted server-only boundaries. Multiple permissive policies must not be merged or removed solely to silence a linter unless the resulting authorization truth table is proven equivalent.

For each proposed RLS performance migration:

1. Capture the affected policy definitions before the change.
2. Re-run the parent, student, administrator, and cross-household visibility assertions above.
3. Apply only the narrow policy-expression change.
4. Re-run the same assertions and compare results.
5. Re-run Supabase security and performance advisors.
6. Reject/roll back any change that expands or contracts access unexpectedly.
