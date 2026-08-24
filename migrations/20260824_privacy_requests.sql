-- SATprep.io privacy-request queue foundation.
-- This migration records authenticated privacy/account requests; it does NOT automatically
-- delete records, cancel Stripe subscriptions, or make legal determinations. Final request
-- verification, statutory timelines, deletion cascades, billing handling, and notification
-- procedures must match the approved Privacy Policy/Terms and legal review before activation.

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  target_student_id uuid references public.students(id) on delete set null,
  request_type text not null check (request_type in ('access','correction','deletion','account_closure','other_privacy')),
  status text not null default 'submitted' check (status in ('submitted','verification_required','in_review','completed','rejected','cancelled')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  completed_at timestamptz,
  handled_by_profile_id uuid references public.profiles(id) on delete set null,
  resolution_code text check (resolution_code is null or char_length(resolution_code) <= 80),
  constraint privacy_request_completion_check check ((status='completed' and completed_at is not null) or status<>'completed')
);

create index if not exists privacy_requests_requester_idx on public.privacy_requests(requester_profile_id,submitted_at desc);
create index if not exists privacy_requests_status_idx on public.privacy_requests(status,submitted_at asc);
create index if not exists privacy_requests_target_student_idx on public.privacy_requests(target_student_id,submitted_at desc) where target_student_id is not null;

alter table public.privacy_requests enable row level security;

-- An authenticated user can create a request only for their own profile and either:
-- 1) no specific learner record, 2) their own student record, or 3) a linked child record.
create policy "privacy_request_self_insert" on public.privacy_requests
for insert to authenticated
with check (
  requester_profile_id=auth.uid()
  and handled_by_profile_id is null
  and verified_at is null
  and completed_at is null
  and status='submitted'
  and (
    target_student_id is null
    or exists (
      select 1 from public.students s
      where s.id=privacy_requests.target_student_id and s.profile_id=auth.uid()
    )
    or exists (
      select 1 from public.parent_students ps
      where ps.student_id=privacy_requests.target_student_id and ps.parent_profile_id=auth.uid()
    )
  )
);

create policy "privacy_request_self_read" on public.privacy_requests
for select to authenticated
using (requester_profile_id=auth.uid());

-- Admin browser sessions may inspect the queue for support triage, but disposition and
-- state changes are deliberately server-controlled so a broad browser update policy cannot
-- alter requester identity, target learner, verification timestamps, or completion state.
create policy "privacy_request_admin_read" on public.privacy_requests
for select to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

comment on table public.privacy_requests is 'Authenticated queue for access/correction/deletion/account-closure/privacy requests. Does not itself perform deletion or legal verification.';
comment on column public.privacy_requests.resolution_code is 'Controlled internal outcome code only; do not store sensitive free-text case notes here.';
