-- SATprep.io launch-readiness performance hardening.
-- Add narrow indexes for foreign keys used by the secure-v3 diagnostic/practice
-- journey and household authorization paths. These indexes do not change RLS,
-- grants, application behavior, or content-approval state.

create index if not exists diagnostic_attempt_items_item_id_idx
  on public.diagnostic_attempt_items(item_id);

create index if not exists diagnostic_attempts_student_id_idx
  on public.diagnostic_attempts(student_id);

create index if not exists diagnostic_responses_content_item_id_idx
  on public.diagnostic_responses(content_item_id);

create index if not exists diagnostic_responses_student_id_idx
  on public.diagnostic_responses(student_id);

create index if not exists practice_responses_item_id_idx
  on public.practice_responses(item_id);

create index if not exists practice_responses_student_id_idx
  on public.practice_responses(student_id);

create index if not exists practice_session_items_item_id_idx
  on public.practice_session_items(item_id);

create index if not exists parent_students_student_id_idx
  on public.parent_students(student_id);

create index if not exists students_household_id_idx
  on public.students(household_id);

create index if not exists profiles_household_id_idx
  on public.profiles(household_id);
