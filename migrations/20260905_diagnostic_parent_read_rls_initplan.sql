-- Authorization-equivalent read-only InitPlan optimization.
-- Preserve the existing PERMISSIVE/PUBLIC/SELECT shape and linked-parent predicates.

alter policy "diagnostic_parent_read" on public.diagnostic_attempts using (
  exists (
    select 1 from public.parent_students ps
    where ps.student_id = diagnostic_attempts.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
);

alter policy "diagnostic_response_parent_read" on public.diagnostic_responses using (
  exists (
    select 1 from public.parent_students ps
    where ps.student_id = diagnostic_responses.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
);
