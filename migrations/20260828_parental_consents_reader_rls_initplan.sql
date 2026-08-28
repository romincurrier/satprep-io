-- InitPlan-only optimization for parental_consents read policy.
-- Authorization shape is intentionally unchanged: default PUBLIC role target,
-- PERMISSIVE SELECT policy, parent-or-student-party predicate.
-- Administrator ALL and parent INSERT policies are intentionally untouched.

alter policy consent_parties_read on public.parental_consents
  using (
    (student_profile_id = (select auth.uid()))
    or (parent_profile_id = (select auth.uid()))
  );
