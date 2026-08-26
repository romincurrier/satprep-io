-- Remove the legacy public email-membership oracle before commercial launch.
-- Signup/login UX must not reveal whether an arbitrary email address is already registered.
-- The function is retained service-only for controlled support/reconciliation if ever needed.

revoke all on function public.email_registered(text) from public, anon, authenticated;
grant execute on function public.email_registered(text) to service_role;

comment on function public.email_registered(text) is 'Service-only account lookup. Public/browser execution is revoked to prevent email/account enumeration.';
