-- Mirror of production migration rotate_live_family_pilot_self_browser.
-- Rotates only an unattached synthetic pilot enrollment after failed browser-harness attempts.
-- Does not alter customer accounts, billing, content approval, or launch gates.

update public.pilot_enrollments
set status = 'revoked',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'superseded_for_self_browser_retry_at', now(),
      'superseded_reason', 'rotate isolated pilot after failed browser harness attempts'
    )
where label = 'Live Family Pilot #1'
  and status = 'open'
  and parent_profile_id is null
  and household_id is null
  and student_id is null;

insert into public.pilot_enrollments (
  token_hash,
  label,
  status,
  expires_at,
  metadata
)
values (
  encode(digest(gen_random_uuid()::text || clock_timestamp()::text, 'sha256'), 'hex'),
  'Live Family Pilot #1',
  'open',
  now() + interval '3 days',
  jsonb_build_object(
    'source', 'full-browser-self-pilot-retry',
    'self_browser_pilot', true,
    'created_for', 'autonomous parent-to-student browser acceptance'
  )
);
