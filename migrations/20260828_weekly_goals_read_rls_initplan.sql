-- InitPlan-only optimization for read-only weekly_goals policies.
-- Preserve commands, role targets, permissiveness, and authorization predicates.

alter policy weekly_goal_parent_read on public.weekly_goals
using (
  exists (
    select 1
    from public.parent_students ps
    where ps.student_id = weekly_goals.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
);

alter policy weekly_goal_student_read on public.weekly_goals
using (
  exists (
    select 1
    from public.students s
    where s.id = weekly_goals.student_id
      and s.profile_id = (select auth.uid())
  )
);
