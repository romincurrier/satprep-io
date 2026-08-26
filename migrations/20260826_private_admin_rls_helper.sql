-- Move the recursive-safe admin role helper out of the Data API exposed public schema.
-- This preserves the existing profile-backed admin authorization truth table while
-- preventing the SECURITY DEFINER helper from being directly exposed as public RPC.

create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$function$;

revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

-- These are expression-only rewrites. Policy commands, role targets, and all
-- non-admin authorization predicates remain unchanged.
alter policy diagnostic_admin_all
  on public.diagnostic_attempts
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy diagnostic_response_admin_all
  on public.diagnostic_responses
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy journey_event_admin_all
  on public.journey_events
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy lesson_admin_read
  on public.lesson_progress
  using ((select private.is_admin()));

alter policy reward_admin_all
  on public.parent_rewards
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy parent_link_admin_all
  on public.parent_students
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy prior_assessment_admin_all
  on public.prior_assessments
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy profile_admin_read
  on public.profiles
  using ((select private.is_admin()));

alter policy profile_admin_update
  on public.profiles
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy attempt_admin_read
  on public.question_attempts
  using ((select private.is_admin()));

alter policy skill_admin_read
  on public.skill_mastery
  using ((select private.is_admin()));

alter policy achievement_admin_all
  on public.student_achievements
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy journey_admin_all
  on public.student_journey
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy mission_admin_all
  on public.student_missions
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy skill_evidence_admin_all
  on public.student_skill_evidence
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy student_admin_all
  on public.students
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy subscription_admin_all
  on public.subscriptions
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy weekly_goal_admin_all
  on public.weekly_goals
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter policy assessment_reports_admin_read
  on storage.objects
  using ((bucket_id = 'assessment-reports'::text) and (select private.is_admin()));

-- Fail the migration instead of silently retaining a second exposed authorization
-- path if any unrewritten object still depends on public.is_admin().
drop function public.is_admin();
