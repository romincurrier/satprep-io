-- Cache auth.uid() once per statement for the household-scoped parent/student-link
-- INSERT policy. This is an InitPlan-only performance change: policy command,
-- default PUBLIC role target, permissiveness, self-parent identity, parent role,
-- and same-household target-student predicates remain unchanged. Existing read
-- and administrator policies are intentionally untouched.

alter policy "parent_link_household_student_insert" on public.parent_students with check (
  parent_profile_id = (select auth.uid())
  and exists (
    select 1
    from public.students s
    join public.profiles p on p.id = (select auth.uid())
    where s.id = parent_students.student_id
      and p.role = 'parent'::text
      and p.household_id is not null
      and s.household_id = p.household_id
  )
);
