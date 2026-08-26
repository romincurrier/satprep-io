-- SATprep.io launch-readiness RLS performance tranche 1.
-- Preserve the exact existing self-authorization semantics while allowing Postgres to
-- evaluate auth.uid() once per statement (InitPlan) rather than once per candidate row.
-- This migration intentionally does NOT change policy roles, commands, permissiveness,
-- grants, columns, or ownership predicates.

alter policy "profile_self_read"
on public.profiles
using ((select auth.uid()) = id);

alter policy "profile_self_update"
on public.profiles
using ((select auth.uid()) = id);

alter policy "student_self_read"
on public.students
using (profile_id = (select auth.uid()));

alter policy "student_self_update"
on public.students
using (profile_id = (select auth.uid()));

comment on table public.profiles is 'Identity/profile table. Browser updates are column-restricted to first_name and last_name; self RLS identity lookups use per-statement InitPlans. Role and other authority fields are server-controlled.';
comment on table public.students is 'Student learning/account record. Self RLS identity lookups use per-statement InitPlans; trusted commercial learning authority remains server-mediated.';
