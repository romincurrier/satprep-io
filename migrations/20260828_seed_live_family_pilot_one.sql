-- One-time live-family acceptance seed. The raw invitation token is intentionally not committed.
-- This mirrors the exact production seed state created on 2026-08-29 UTC.
insert into public.pilot_enrollments (token_hash,label,status,expires_at,metadata)
values (
  '5bbd26219eb0678ea832df898557c682c11cd6020c0cda49c77a28623f96253d',
  'Live Family Pilot #1',
  'open',
  '2026-09-01 02:02:22.478338+00'::timestamptz,
  jsonb_build_object('pilot_version','live-pilot-v1','purpose','manual end-to-end family acceptance')
)
on conflict (token_hash) do nothing;
