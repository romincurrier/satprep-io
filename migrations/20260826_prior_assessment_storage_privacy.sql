-- Protect prior-assessment upload identity and provide a service-only transactional
-- database cleanup step for Storage-API-mediated report deletion.

alter table public.prior_assessments
  add constraint prior_assessment_file_path_identity
  check (
    file_path is null
    or (
      created_by is not null
      and split_part(file_path, '/', 1) = created_by::text
      and split_part(file_path, '/', 2) = student_id::text
      and split_part(file_path, '/', 3) <> ''
      and position('..' in file_path) = 0
      and left(file_path, 1) <> '/'
    )
  ) not valid;

alter table public.prior_assessments
  validate constraint prior_assessment_file_path_identity;

create or replace function private.enforce_prior_assessment_upload_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.student_id is distinct from old.student_id
     or new.created_by is distinct from old.created_by
     or new.source_method is distinct from old.source_method
     or new.file_path is distinct from old.file_path then
    raise exception 'prior assessment upload identity fields are immutable';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_prior_assessment_upload_identity() from public;
revoke all on function private.enforce_prior_assessment_upload_identity() from anon;
revoke all on function private.enforce_prior_assessment_upload_identity() from authenticated;

drop trigger if exists prior_assessment_upload_identity_lock on public.prior_assessments;
create trigger prior_assessment_upload_identity_lock
before update on public.prior_assessments
for each row
execute function private.enforce_prior_assessment_upload_identity();

create or replace function public.delete_prior_assessment_record(p_assessment_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_student_id uuid;
begin
  select pa.student_id
    into v_student_id
  from public.prior_assessments pa
  where pa.id = p_assessment_id
  for update;

  if not found then
    return false;
  end if;

  update public.students s
  set recommended_path = case
    when jsonb_typeof(s.recommended_path) = 'object'
      and jsonb_typeof(s.recommended_path -> 'prior_assessments') = 'array'
    then jsonb_set(
      s.recommended_path,
      '{prior_assessments}',
      coalesce(
        (
          select jsonb_agg(entry)
          from jsonb_array_elements(s.recommended_path -> 'prior_assessments') entry
          where entry ->> 'source_id' is distinct from p_assessment_id::text
        ),
        '[]'::jsonb
      ),
      true
    )
    else s.recommended_path
  end
  where s.id = v_student_id;

  delete from public.prior_assessments
  where id = p_assessment_id;

  return true;
end;
$$;

revoke all on function public.delete_prior_assessment_record(uuid) from public;
revoke all on function public.delete_prior_assessment_record(uuid) from anon;
revoke all on function public.delete_prior_assessment_record(uuid) from authenticated;
grant execute on function public.delete_prior_assessment_record(uuid) to service_role;
