-- SATprep.io operational item-calibration foundation.
-- Depends on 20260824_content_system.sql and secure-v3 response provenance.
-- These views intentionally expose no student identifiers and are not browser-readable.

create or replace view public.content_item_calibration_v
with (security_invoker = true)
as
select
  dr.content_item_id as item_id,
  ci.section,
  ci.domain_key,
  ci.skill_key,
  ci.difficulty,
  count(*)::bigint as response_count,
  avg(case when dr.is_correct then 1.0 else 0.0 end)::numeric(8,5) as facility,
  avg(dr.response_ms)::numeric(12,2) as mean_response_ms,
  percentile_cont(0.5) within group (order by dr.response_ms)::numeric(12,2) as median_response_ms,
  corr(
    case when dr.is_correct then 1.0 else 0.0 end,
    case when ci.section='MATH' then da.math_score else da.rw_score end
  )::numeric(8,5) as section_score_correlation,
  count(*) filter (where dr.selected_answer=0)::bigint as option_a_count,
  count(*) filter (where dr.selected_answer=1)::bigint as option_b_count,
  count(*) filter (where dr.selected_answer=2)::bigint as option_c_count,
  count(*) filter (where dr.selected_answer=3)::bigint as option_d_count,
  min(dr.created_at) as first_observed_at,
  max(dr.created_at) as last_observed_at
from public.diagnostic_responses dr
join public.diagnostic_attempts da on da.id=dr.attempt_id
join public.content_items ci on ci.id=dr.content_item_id
where dr.scored_by_server=true
  and dr.content_item_id is not null
  and dr.content_item_id=dr.question_key
  and coalesce(da.summary->>'engine','legacy')='secure-v3'
  and da.status='completed'
group by dr.content_item_id,ci.section,ci.domain_key,ci.skill_key,ci.difficulty;

create or replace view public.content_skill_calibration_v
with (security_invoker = true)
as
select
  ci.section,
  ci.domain_key,
  ci.skill_key,
  ci.difficulty,
  count(distinct dr.content_item_id)::bigint as items_observed,
  count(*)::bigint as response_count,
  avg(case when dr.is_correct then 1.0 else 0.0 end)::numeric(8,5) as facility,
  avg(dr.response_ms)::numeric(12,2) as mean_response_ms
from public.diagnostic_responses dr
join public.diagnostic_attempts da on da.id=dr.attempt_id
join public.content_items ci on ci.id=dr.content_item_id
where dr.scored_by_server=true
  and dr.content_item_id is not null
  and dr.content_item_id=dr.question_key
  and coalesce(da.summary->>'engine','legacy')='secure-v3'
  and da.status='completed'
group by ci.section,ci.domain_key,ci.skill_key,ci.difficulty;

revoke all on public.content_item_calibration_v from anon, authenticated;
revoke all on public.content_skill_calibration_v from anon, authenticated;
grant select on public.content_item_calibration_v to service_role;
grant select on public.content_skill_calibration_v to service_role;

comment on view public.content_item_calibration_v is 'Server-only aggregate item performance for QA/calibration. Contains no student identifiers; not a replacement for formal psychometric review.';
comment on view public.content_skill_calibration_v is 'Server-only aggregate skill/difficulty performance for content QA planning.';
