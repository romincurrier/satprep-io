-- Cache auth.uid() once per statement for privacy_requests browser policies.
-- This is an InitPlan-only performance change: policy commands, roles, and
-- authorization predicates remain unchanged.

alter policy "privacy_request_admin_read" on public.privacy_requests using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  )
);

alter policy "privacy_request_self_insert" on public.privacy_requests with check (
  requester_profile_id = (select auth.uid())
  and handled_by_profile_id is null
  and verified_at is null
  and completed_at is null
  and status = 'submitted'
  and (
    target_student_id is null
    or exists (
      select 1
      from public.students s
      where s.id = privacy_requests.target_student_id
        and s.profile_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.parent_students ps
      where ps.student_id = privacy_requests.target_student_id
        and ps.parent_profile_id = (select auth.uid())
    )
  )
);

alter policy "privacy_request_self_read" on public.privacy_requests using (
  requester_profile_id = (select auth.uid())
);
