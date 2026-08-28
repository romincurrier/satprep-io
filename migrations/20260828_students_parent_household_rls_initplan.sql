-- Cache auth.uid() once per statement for the two parent-household write policies
-- on students. This is an InitPlan-only performance change: INSERT/UPDATE
-- commands, default PUBLIC role targets, permissiveness, parent role, non-null
-- household requirement, and same-household scope remain unchanged. Existing
-- read, student-self, and administrator policies are intentionally untouched.

alter policy "parent_household_student_insert" on public.students with check (
  household_id is not null
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'parent'::text
      and p.household_id = students.household_id
  )
);

alter policy "parent_household_student_update" on public.students using (
  household_id is not null
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'parent'::text
      and p.household_id = students.household_id
  )
);
