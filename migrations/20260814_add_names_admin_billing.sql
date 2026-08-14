alter table public.profiles add column if not exists last_name text;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  requested_role text;
  fname text;
  lname text;
  full_name text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role','student');
  if requested_role not in ('student','parent') then requested_role := 'student'; end if;
  fname := coalesce(new.raw_user_meta_data->>'first_name','');
  lname := coalesce(new.raw_user_meta_data->>'last_name','');
  full_name := trim(concat_ws(' ', fname, lname));

  insert into public.profiles(id,email,first_name,last_name,role)
  values(new.id,new.email,fname,lname,requested_role);

  if requested_role='student' then
    insert into public.students(profile_id,display_name) values(new.id,full_name);
  end if;
  return new;
end;
$$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text unique,
  provider_subscription_id text unique,
  plan_key text,
  status text not null default 'inactive',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscription_self_read" on public.subscriptions for select using (profile_id = auth.uid());
create policy "subscription_admin_all" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());
create policy "profile_admin_read" on public.profiles for select using (public.is_admin());
create policy "profile_admin_update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "student_admin_all" on public.students for all using (public.is_admin()) with check (public.is_admin());
create policy "parent_link_admin_all" on public.parent_students for all using (public.is_admin()) with check (public.is_admin());
create policy "lesson_admin_read" on public.lesson_progress for select using (public.is_admin());
create policy "skill_admin_read" on public.skill_mastery for select using (public.is_admin());
create policy "attempt_admin_read" on public.question_attempts for select using (public.is_admin());