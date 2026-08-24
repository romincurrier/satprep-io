-- Critical authorization hardening for public.profiles.
--
-- The original MVP self-update RLS policy allowed a user to update their own profile row,
-- but RLS alone does not limit which columns can be changed. Because `role` drives
-- public.is_admin(), a browser client must never be able to change role/household/billing
-- authority by issuing a direct PostgREST update.
--
-- Keep ordinary authenticated profile edits limited to display-name fields. All authority
-- fields (role, household_id, billing_owner, email identity, DOB/consent-linked fields, etc.)
-- are changed only through trusted server/service-role workflows.

revoke update on table public.profiles from authenticated;
grant update (first_name, last_name) on table public.profiles to authenticated;

-- Anonymous clients should have no profile mutation authority.
revoke insert, update, delete on table public.profiles from anon;

comment on table public.profiles is 'Identity/profile table. Browser updates are column-restricted to first_name and last_name; role and other authority fields are server-controlled.';
