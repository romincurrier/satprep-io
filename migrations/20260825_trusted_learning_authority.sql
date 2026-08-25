-- SATprep.io trusted learning-authority lock.
-- Apply only after the secure server-scored practice/diagnostic paths are live and verified.
-- Retains student/parent read visibility while removing browser authority to forge mastery,
-- lesson completion, or legacy question-attempt rows. Service-role server paths remain trusted.

-- skill_mastery: students and parents may read authorized rows, but only trusted server code
-- may create or change mastery values used by adaptive planning.
drop policy if exists "skill_student_all" on public.skill_mastery;
drop policy if exists "skill_student_read" on public.skill_mastery;
create policy "skill_student_read" on public.skill_mastery for select using (
  exists (
    select 1 from public.students s
    where s.id=skill_mastery.student_id and s.profile_id=auth.uid()
  )
);
revoke insert, update, delete on table public.skill_mastery from anon, authenticated;
grant select on table public.skill_mastery to authenticated;

-- lesson_progress: commercial completion/score state is finalized atomically by the trusted
-- practice server. Browser clients retain read access for dashboards only.
drop policy if exists "lesson_student_all" on public.lesson_progress;
drop policy if exists "lesson_student_read" on public.lesson_progress;
create policy "lesson_student_read" on public.lesson_progress for select using (
  exists (
    select 1 from public.students s
    where s.id=lesson_progress.student_id and s.profile_id=auth.uid()
  )
);
revoke insert, update, delete on table public.lesson_progress from anon, authenticated;
grant select on table public.lesson_progress to authenticated;

-- question_attempts is a legacy browser-scored QA surface. Preserve historical authorized
-- reads for prelaunch support/reconciliation, but retire browser insertion authority.
drop policy if exists "attempt_student_insert" on public.question_attempts;
revoke insert, update, delete on table public.question_attempts from anon, authenticated;
grant select on table public.question_attempts to authenticated;

comment on table public.skill_mastery is 'Trusted mastery state. Browser roles are read-only; secure diagnostic/practice server paths own mutations.';
comment on table public.lesson_progress is 'Trusted lesson/practice progress. Browser roles are read-only; secure server finalization owns mutations.';
comment on table public.question_attempts is 'Legacy browser-scored attempt history retained read-only for prelaunch support; new commercial responses use server-only diagnostic/practice response tables.';
