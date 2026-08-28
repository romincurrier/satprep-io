-- Production-applied 2026-08-28.
-- InitPlan-only optimization for the legacy profile-backed administrator policies
-- on synthetic acceptance-test telemetry tables. This preserves the existing
-- PERMISSIVE/PUBLIC/ALL policy shape and exact administrator predicate.

alter policy admin_test_runs_all on public.test_runs
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

alter policy admin_test_events_all on public.test_events
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);
