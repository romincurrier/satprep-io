-- SATprep.io commercial practice-session foundation.
-- Commercial practice is server-mediated so content keys stay private, answers are scored
-- by trusted code, practice can resume after interruption, and mastery cannot be forged by
-- direct browser writes.

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  skill_key text not null,
  target_exam text not null check (target_exam in ('SAT','PSAT/NMSQT','PSAT 10')),
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  content_version text not null default 'server-practice-v3',
  score numeric check (score between 0 and 1),
  mastery_after numeric check (mastery_after between 0 and 1),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.practice_session_items (
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  position integer not null check (position >= 0),
  item_id text not null references public.content_items(id),
  selected_at timestamptz not null default now(),
  primary key (session_id, position),
  unique (session_id, item_id)
);

create table if not exists public.practice_responses (
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  item_id text not null references public.content_items(id),
  position integer not null check (position >= 0),
  selected_answer smallint not null check (selected_answer between 0 and 3),
  is_correct boolean not null,
  response_ms integer not null default 0 check (response_ms between 0 and 3600000),
  scored_by_server boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (session_id, item_id),
  unique (session_id, position)
);

create index if not exists practice_sessions_student_idx on public.practice_sessions(student_id,status,updated_at desc);
create index if not exists practice_sessions_skill_idx on public.practice_sessions(student_id,skill_key,status,updated_at desc);
create index if not exists practice_session_items_idx on public.practice_session_items(session_id,position);
create index if not exists practice_responses_session_idx on public.practice_responses(session_id,position);

alter table public.practice_sessions enable row level security;
alter table public.practice_session_items enable row level security;
alter table public.practice_responses enable row level security;

-- These tables are intentionally server-only. Students receive safe question projections
-- and post-answer instructional feedback through authenticated API routes. Parents receive
-- aggregate progress from existing progress/mastery surfaces, not raw answer rows.
revoke all on table public.practice_sessions from public, anon, authenticated;
revoke all on table public.practice_session_items from public, anon, authenticated;
revoke all on table public.practice_responses from public, anon, authenticated;

-- Complete a practice session exactly once under a row lock. Mastery and lesson progress
-- are updated inside the same transaction so duplicate last-answer requests cannot double
-- count a completed session.
create or replace function public.finalize_practice_session(p_session_id uuid)
returns table(score numeric, mastery_after numeric, completed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.practice_sessions%rowtype;
  v_total integer;
  v_answered integer;
  v_correct integer;
  v_score numeric;
  v_old_items integer;
  v_old_mastery numeric;
  v_new_items integer;
  v_new_mastery numeric;
  v_best numeric;
  v_now timestamptz := now();
begin
  select * into s from public.practice_sessions where id=p_session_id for update;
  if not found then raise exception 'Practice session not found'; end if;

  if s.status='completed' then
    return query select s.score,s.mastery_after,true;
    return;
  end if;
  if s.status<>'in_progress' then
    raise exception 'Practice session is not active';
  end if;

  select count(*) into v_total from public.practice_session_items where session_id=s.id;
  select count(*),count(*) filter (where is_correct)
    into v_answered,v_correct
    from public.practice_responses
    where session_id=s.id and scored_by_server=true;

  if v_total=0 or v_answered<v_total then
    return query select null::numeric,null::numeric,false;
    return;
  end if;

  v_score := v_correct::numeric / v_total::numeric;
  select coalesce(items_attempted,0),coalesce(mastery,0)
    into v_old_items,v_old_mastery
    from public.skill_mastery
    where student_id=s.student_id and skill_key=s.skill_key;
  if not found then v_old_items:=0;v_old_mastery:=0;end if;

  v_new_items := v_old_items + v_total;
  v_new_mastery := case when v_new_items>0
    then ((v_old_mastery*v_old_items)+v_correct)::numeric/v_new_items::numeric
    else v_score end;

  insert into public.skill_mastery(student_id,skill_key,mastery,items_attempted,updated_at)
  values(s.student_id,s.skill_key,v_new_mastery,v_new_items,v_now)
  on conflict(student_id,skill_key) do update set
    mastery=excluded.mastery,
    items_attempted=excluded.items_attempted,
    updated_at=excluded.updated_at;

  select coalesce(best_score,0) into v_best
    from public.lesson_progress
    where student_id=s.student_id and lesson_key='official-'||s.skill_key;
  if not found then v_best:=0;end if;
  v_best := greatest(v_best,v_score);

  insert into public.lesson_progress(student_id,lesson_key,current_question,best_score,last_score,completed_at,updated_at)
  values(s.student_id,'official-'||s.skill_key,0,v_best,v_score,v_now,v_now)
  on conflict(student_id,lesson_key) do update set
    current_question=0,
    best_score=greatest(coalesce(public.lesson_progress.best_score,0),excluded.best_score),
    last_score=excluded.last_score,
    completed_at=excluded.completed_at,
    updated_at=excluded.updated_at;

  update public.practice_sessions set
    status='completed',score=v_score,mastery_after=v_new_mastery,
    completed_at=v_now,updated_at=v_now
    where id=s.id;

  return query select v_score,v_new_mastery,true;
end;
$$;

revoke all on function public.finalize_practice_session(uuid) from public, anon, authenticated;
grant execute on function public.finalize_practice_session(uuid) to service_role;

comment on table public.practice_sessions is 'Server-only commercial practice sessions. Enables durable resume, idempotent completion, and trusted mastery updates.';
comment on table public.practice_session_items is 'Server-only immutable practice item plan; browser clients receive one safe item at a time.';
comment on table public.practice_responses is 'Server-scored practice responses. Correct answers/explanations are returned after submission but are not persisted in browser-writable tables.';
comment on function public.finalize_practice_session(uuid) is 'Atomically finalizes one server-scored practice session and updates trusted mastery/lesson progress exactly once.';
