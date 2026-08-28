-- Production-applied 2026-08-28.
-- InitPlan-only optimization for subscription reader policies. The separate
-- subscription_admin_all policy is intentionally untouched.

alter policy subscription_self_read on public.subscriptions
using (profile_id = (select auth.uid()));

alter policy subscription_household_billing_owner_read on public.subscriptions
using (
  household_id is not null
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.household_id = subscriptions.household_id
      and p.billing_owner = true
  )
);
