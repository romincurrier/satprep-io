-- InitPlan-only optimization for the read-only parent_rewards student policy.
-- Preserve command, role target, permissiveness, and learner-self authorization predicate.
-- Leave the separate administrator and parent ALL/write policies unchanged.

alter policy reward_student_read on public.parent_rewards
using (
  exists (
    select 1
    from public.students s
    where s.id = parent_rewards.student_id
      and s.profile_id = (select auth.uid())
  )
);
