-- SATprep.io marketing measurement privilege hardening.
-- The original measurement migration enables RLS and creates no browser policies, but
-- Supabase default grants can still leave the table queryable (typically as an empty result)
-- by browser roles. Commercial measurement is intentionally server-mediated only.

revoke all on table public.marketing_events from public, anon, authenticated;
grant select, insert on table public.marketing_events to service_role;

-- Identity sequences can require explicit sequence privilege for inserts depending on role
-- defaults. Grant only the minimum needed to the trusted service role.
do $$
declare
  seq_name text;
begin
  select pg_get_serial_sequence('public.marketing_events','id') into seq_name;
  if seq_name is not null then
    execute format('revoke all on sequence %s from public, anon, authenticated', seq_name);
    execute format('grant usage, select on sequence %s to service_role', seq_name);
  end if;
end $$;

comment on table public.marketing_events is 'Privacy-minimized public-site acquisition events. Database access is service-role only; browsers submit through the gated same-origin server endpoint.';
