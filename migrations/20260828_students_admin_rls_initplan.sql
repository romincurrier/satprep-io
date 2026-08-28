-- Cache auth.uid() once per statement for the legacy profile-backed administrator
-- ALL policy on students. This is an InitPlan-only performance change: the ALL
-- command, default PUBLIC role target, permissiveness, and administrator predicate
-- remain unchanged in both USING and WITH CHECK. All other students policies,
-- including the private-helper admin policy, are intentionally untouched.

alter policy "admin_students_all" on public.students using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'::text
  )
) with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'::text
  )
);
