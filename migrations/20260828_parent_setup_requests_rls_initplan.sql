-- Cache auth.uid() once per statement for the administrator read policy on
-- parent_setup_requests. This is an InitPlan-only performance change: the
-- policy command, default PUBLIC role target, permissiveness, and profile-backed
-- administrator predicate remain unchanged. The public insert policy is untouched.

alter policy "admin_parent_setup_request_read" on public.parent_setup_requests using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);
