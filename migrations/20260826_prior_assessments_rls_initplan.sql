-- Cache auth.uid() once per statement for prior_assessments browser policies.
-- This is an InitPlan-only performance change: policy commands, roles, and
-- authorization predicates remain unchanged.

alter policy "prior_assessment_student_read" on public.prior_assessments using (
  exists (
    select 1
    from public.students s
    where s.id = prior_assessments.student_id
      and s.profile_id = (select auth.uid())
  )
);

alter policy "prior_assessment_student_insert" on public.prior_assessments with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.students s
    where s.id = prior_assessments.student_id
      and s.profile_id = (select auth.uid())
  )
);

alter policy "prior_assessment_parent_read" on public.prior_assessments using (
  exists (
    select 1
    from public.parent_students ps
    where ps.student_id = prior_assessments.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
);

alter policy "prior_assessment_parent_insert" on public.prior_assessments with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.parent_students ps
    where ps.student_id = prior_assessments.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
);

alter policy "prior_assessment_student_update" on public.prior_assessments using (
  exists (
    select 1
    from public.students s
    where s.id = prior_assessments.student_id
      and s.profile_id = (select auth.uid())
  )
) with check (
  exists (
    select 1
    from public.students s
    where s.id = prior_assessments.student_id
      and s.profile_id = (select auth.uid())
  )
);

alter policy "prior_assessment_parent_update" on public.prior_assessments using (
  exists (
    select 1
    from public.parent_students ps
    where ps.student_id = prior_assessments.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
) with check (
  exists (
    select 1
    from public.parent_students ps
    where ps.student_id = prior_assessments.student_id
      and ps.parent_profile_id = (select auth.uid())
  )
);
