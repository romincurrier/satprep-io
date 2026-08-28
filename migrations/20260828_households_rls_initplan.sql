-- Cache auth.uid() once per statement for the two legacy household policies.
-- This is an InitPlan-only performance change: policy commands, default PUBLIC
-- role targets, permissiveness, membership scope, and profile-backed admin
-- predicates remain unchanged. Existing multiple-permissive SELECT policies are
-- intentionally not consolidated in this tranche.

alter policy "admin_household_all" on public.households using (
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

alter policy "household_member_read" on public.households using (
  exists (
    select 1
    from public.profiles p
    where p.household_id = households.id
      and p.id = (select auth.uid())
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'::text
  )
);
