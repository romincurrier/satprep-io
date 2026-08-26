-- SATprep.io launch-readiness performance hardening.
-- Complete narrow indexing of currently unindexed foreign keys. These indexes
-- do not change RLS, grants, application behavior, or content-approval state.

create index if not exists parent_invitations_accepted_by_idx
  on public.parent_invitations(accepted_by);

create index if not exists parent_invitations_student_profile_id_idx
  on public.parent_invitations(student_profile_id);

create index if not exists parent_rewards_parent_profile_id_idx
  on public.parent_rewards(parent_profile_id);

create index if not exists parent_rewards_student_id_idx
  on public.parent_rewards(student_id);

create index if not exists parental_consents_parent_profile_id_idx
  on public.parental_consents(parent_profile_id);

create index if not exists prior_assessments_created_by_idx
  on public.prior_assessments(created_by);

create index if not exists prior_assessments_student_id_idx
  on public.prior_assessments(student_id);

create index if not exists privacy_requests_handled_by_profile_id_idx
  on public.privacy_requests(handled_by_profile_id);

create index if not exists question_attempts_student_id_idx
  on public.question_attempts(student_id);

create index if not exists student_missions_student_id_idx
  on public.student_missions(student_id);

create index if not exists student_skill_evidence_student_id_idx
  on public.student_skill_evidence(student_id);

create index if not exists subscriptions_billing_profile_id_idx
  on public.subscriptions(billing_profile_id);

create index if not exists test_events_test_run_id_idx
  on public.test_events(test_run_id);

create index if not exists test_runs_test_student_id_idx
  on public.test_runs(test_student_id);
