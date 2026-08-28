-- Production-applied 2026-08-28.
-- InitPlan-only optimization for journey-event parent/student read policies.
-- This preserves the existing PERMISSIVE/default-PUBLIC/SELECT policy shape
-- and exact parent-link / student-self authorization predicates. The separate
-- journey_event_admin_all policy is intentionally untouched.

alter policy journey_event_parent_read on public.journey_events
using (
  exists (
    select 1
    from public.parent_students ps
    where ps.student_id = journey_events.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
);

alter policy journey_event_student_read on public.journey_events
using (
  exists (
    select 1
    from public.students s
    where s.id = journey_events.student_id
      and s.profile_id = (select auth.uid())
  )
);
