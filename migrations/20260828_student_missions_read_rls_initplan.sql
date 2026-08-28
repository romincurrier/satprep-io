-- InitPlan-only optimization for student_missions read policies.
-- Authorization shape is intentionally unchanged: default PUBLIC role target,
-- PERMISSIVE SELECT policies, linked-parent / student-self predicates.
-- Administrator and authenticated student write policies are intentionally untouched.

alter policy mission_parent_read on public.student_missions
  using (
    exists (
      select 1
      from public.parent_students ps
      where ps.student_id = student_missions.student_id
        and ps.parent_profile_id = (select auth.uid())
    )
  );

alter policy mission_student_read on public.student_missions
  using (
    exists (
      select 1
      from public.students s
      where s.id = student_missions.student_id
        and s.profile_id = (select auth.uid())
    )
  );
