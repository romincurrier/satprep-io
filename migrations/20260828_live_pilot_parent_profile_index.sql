-- Mirrors production migration live_pilot_parent_profile_index.
-- Narrow performance index only; no authorization semantics change.
create index if not exists pilot_enrollments_parent_profile_idx
  on public.pilot_enrollments(parent_profile_id);
