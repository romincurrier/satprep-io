create table if not exists public.pilot_enrollments (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  label text not null default 'Live family pilot',
  status text not null default 'open' check (status in ('open','claimed','completed','revoked')),
  expires_at timestamptz not null,
  parent_profile_id uuid references public.profiles(id) on delete set null,
  household_id uuid references public.households(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz
);
create index if not exists pilot_enrollments_household_idx on public.pilot_enrollments(household_id);
create index if not exists pilot_enrollments_student_idx on public.pilot_enrollments(student_id);
create index if not exists pilot_enrollments_status_idx on public.pilot_enrollments(status, expires_at);
alter table public.pilot_enrollments enable row level security;
revoke all on table public.pilot_enrollments from anon, authenticated;
comment on table public.pilot_enrollments is 'Service-only live pilot enrollment ledger. No browser policies by design.';
