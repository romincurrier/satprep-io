-- Production-applied 2026-08-28.
-- InitPlan-only optimization for student-achievement parent/student read policies.
-- This preserves the existing PERMISSIVE/default-PUBLIC/SELECT policy shape
-- and exact parent-link / student-self authorization predicates. The separate
-- achievement_admin_all and authenticated-only achievement_student_insert
-- policies are intentionally untouched.

alter policy achievement_parent_read on public.student_achievements
using (
  exists (
    select 1
    from public.parent_students ps
    where ps.student_id = student_achievements.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
);

alter policy achievement_student_read on public.student_achievements
using (
  exists (
    select 1
    from public.students s
    where s.id = student_achievements.student_id
      and s.profile_id = (select auth.uid())
  )
);
