-- InitPlan-only optimization for the read-only parent invitation student policy.
-- Preserve SELECT command, default PUBLIC role target, permissiveness, and student-self authorization semantics.
-- Leave administrator ALL and student INSERT policies unchanged.

alter policy student_invite_read on public.parent_invitations
using (student_profile_id = (select auth.uid()));
