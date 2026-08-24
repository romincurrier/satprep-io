-- Defense-in-depth age gate for direct student account creation.
-- This does not by itself establish COPPA or other legal compliance. It prevents the
-- browser's student-signup path from being the only control separating under-13
-- users from the parent/guardian account workflow.
--
-- Parent/guardian-created student logins are created through the server admin API
-- and carry a trusted auth app_metadata marker that ordinary signup clients cannot set.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  fname text;
  lname text;
  full_name text;
  dob_text text;
  dob date;
  parent_authorized boolean := false;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role','student');
  if requested_role not in ('student','parent') then
    requested_role := 'student';
  end if;

  fname := coalesce(new.raw_user_meta_data->>'first_name','');
  lname := coalesce(new.raw_user_meta_data->>'last_name','');
  full_name := trim(concat_ws(' ', fname, lname));

  -- raw_app_meta_data is controlled by the auth/admin service, unlike
  -- raw_user_meta_data supplied by a public signup client.
  begin
    parent_authorized := coalesce((new.raw_app_meta_data->>'satprep_parent_authorized')::boolean,false);
  exception when others then
    parent_authorized := false;
  end;

  if requested_role = 'student' and not parent_authorized then
    dob_text := nullif(trim(coalesce(new.raw_user_meta_data->>'date_of_birth','')), '');
    if dob_text is null then
      raise exception 'A valid date of birth is required for direct student signup.' using errcode = 'P0001';
    end if;

    begin
      dob := dob_text::date;
    exception when others then
      raise exception 'A valid date of birth is required for direct student signup.' using errcode = 'P0001';
    end;

    if dob > current_date then
      raise exception 'A valid date of birth is required for direct student signup.' using errcode = 'P0001';
    end if;

    if dob > (current_date - interval '13 years')::date then
      raise exception 'A parent or guardian must create this student account.' using errcode = 'P0001';
    end if;
  end if;

  insert into public.profiles(id,email,first_name,last_name,role)
  values(new.id,new.email,fname,lname,requested_role);

  if requested_role='student' then
    insert into public.students(profile_id,display_name)
    values(new.id,full_name);
  end if;

  return new;
end;
$$;

-- Trigger already exists in established environments, but keeping this idempotent
-- makes the migration safe for a reconciled/new database as well.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
