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

comment on table public.practice_sessions is 'Server-only commercial practice sessions. Enables durable resume, idempotent completion, and trusted mastery updates.';
comment on table public.practice_session_items is 'Server-only immutable practice item plan; browser clients receive one safe item at a time.';
comment on table public.practice_responses is 'Server-scored practice responses. Correct answers/explanations are returned after submission but are not persisted in browser-writable tables.';
