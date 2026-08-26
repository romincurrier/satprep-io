-- SATprep.io secure-v3 diagnostic resume/concurrency hardening.
-- Prevents concurrent tabs/devices from creating more than one active diagnostic attempt for the same learner.

create unique index if not exists diagnostic_attempts_one_in_progress_per_student_idx
  on public.diagnostic_attempts(student_id)
  where status = 'in_progress';

comment on index public.diagnostic_attempts_one_in_progress_per_student_idx
is 'Launch-safety invariant: a learner may have only one in-progress diagnostic attempt, so refresh/new-tab/new-device session races converge on the same durable assessment state.';
