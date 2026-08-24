-- Durable fixed-window rate limiting for privileged and abuse-sensitive server APIs.
-- This table/function is intentionally service-role only. Browser clients must never
-- be able to inspect or manipulate rate-limit counters.

create table if not exists public.api_rate_limits (
  key_hash text not null,
  route_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, route_key, window_start)
);

alter table public.api_rate_limits enable row level security;

revoke all on table public.api_rate_limits from public, anon, authenticated;
grant all on table public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_route_key text,
  p_window_seconds integer,
  p_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid rate-limit key';
  end if;
  if p_route_key is null or length(p_route_key) < 1 or length(p_route_key) > 120 or p_route_key !~ '^[a-z0-9_./:-]+$' then
    raise exception 'invalid rate-limit route';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit window';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'invalid rate-limit limit';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  insert into public.api_rate_limits(key_hash, route_key, window_start, request_count, updated_at)
  values (p_key_hash, p_route_key, v_window_start, 1, v_now)
  on conflict (key_hash, route_key, window_start)
  do update set
    request_count = public.api_rate_limits.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_count;

  -- Keep abuse-prevention data short-lived without requiring a separate scheduler.
  -- Approximately one percent of legitimate limiter calls opportunistically clear
  -- stale hashed counters older than 48 hours. No raw network/user identifier is stored.
  if random() < 0.01 then
    delete from public.api_rate_limits
    where updated_at < v_now - interval '48 hours';
  end if;

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'count', v_count,
    'limit', p_limit,
    'reset_at', v_reset_at
  );
end;
$$;

revoke all on function public.consume_api_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text,text,integer,integer) to service_role;

comment on table public.api_rate_limits is 'Service-only fixed-window counters for API abuse controls; stores hashed subjects, not raw user or network identifiers, with opportunistic 48-hour pruning.';
comment on function public.consume_api_rate_limit(text,text,integer,integer) is 'Atomically consumes one request from a service-only fixed-window rate limit, opportunistically prunes stale counters, and returns allowed/count/limit/reset_at.';
