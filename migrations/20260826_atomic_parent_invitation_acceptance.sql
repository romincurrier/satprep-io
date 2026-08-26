-- SATprep.io launch-readiness authorization hardening.
-- Move parent invitation acceptance into one database transaction so a retry,
-- concurrent request, or mid-request failure cannot leave household/profile/link/
-- consent state partially updated. The RPC is service-role only and does not
-- grant any new browser authority.

create or replace function public.accept_parent_invitation_atomic(
  p_invitation_id uuid,
  p_parent_profile_id uuid,
  p_consent_version text default '2026-08'
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_parent public.profiles%rowtype;
  v_invitation public.parent_invitations%rowtype;
  v_student public.students%rowtype;
  v_household_id uuid;
  v_other_students integer := 0;
  v_subscription_status text;
  v_plan_key text;
begin
  if nullif(btrim(coalesce(p_consent_version, '')), '') is null
     or length(p_consent_version) > 64 then
    return jsonb_build_object('ok', false, 'code', 'invalid_consent_version');
  end if;

  -- Serialize acceptance work for this parent profile.
  select *
    into v_parent
    from public.profiles
   where id = p_parent_profile_id
   for update;

  if not found or v_parent.role <> 'parent' then
    return jsonb_build_object('ok', false, 'code', 'parent_required');
  end if;

  select *
    into v_invitation
    from public.parent_invitations
   where id = p_invitation_id
   for update;

  if not found
     or v_invitation.status <> 'pending'
     or lower(btrim(v_invitation.parent_email)) <> lower(btrim(coalesce(v_parent.email, ''))) then
    return jsonb_build_object('ok', false, 'code', 'invitation_unavailable');
  end if;

  if v_invitation.expires_at <= now() then
    update public.parent_invitations
       set status = 'expired'
     where id = v_invitation.id
       and status = 'pending';
    return jsonb_build_object('ok', false, 'code', 'invitation_expired');
  end if;

  select *
    into v_student
    from public.students
   where profile_id = v_invitation.student_profile_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'student_missing');
  end if;

  -- Preserve the existing isolation rule: an invite cannot move a student out
  -- of a different household or silently attach a household-less parent to one.
  if v_student.household_id is not null
     and (v_parent.household_id is null or v_student.household_id <> v_parent.household_id) then
    return jsonb_build_object('ok', false, 'code', 'student_household_conflict');
  end if;

  v_household_id := v_parent.household_id;

  if v_household_id is null then
    insert into public.households(name, student_limit)
    values (
      coalesce(nullif(btrim(v_parent.email), ''), 'Family') || ' household',
      1
    )
    returning id into v_household_id;

    update public.profiles
       set household_id = v_household_id,
           billing_owner = true
     where id = v_parent.id;
  else
    -- Serialize household membership/capacity checks across parents sharing it.
    perform 1
      from public.households
     where id = v_household_id
     for update;
  end if;

  select count(*)::integer
    into v_other_students
    from public.students
   where household_id = v_household_id
     and id <> v_student.id;

  select status, plan_key
    into v_subscription_status, v_plan_key
    from public.subscriptions
   where household_id = v_household_id
   order by created_at desc
   limit 1;

  if v_other_students >= 1
     and v_subscription_status in ('trialing', 'active')
     and coalesce(v_plan_key, '') like 'individual_%' then
    -- This branch runs before student/link/consent/invitation writes. If the
    -- household existed before this call, no acceptance state has changed.
    return jsonb_build_object('ok', false, 'code', 'requires_family_plan');
  end if;

  update public.students
     set household_id = v_household_id
   where id = v_student.id;

  update public.profiles
     set household_id = v_household_id
   where id = v_invitation.student_profile_id;

  insert into public.parent_students(parent_profile_id, student_id)
  values (v_parent.id, v_student.id)
  on conflict (parent_profile_id, student_id) do nothing;

  update public.parent_invitations
     set status = 'accepted',
         accepted_by = v_parent.id,
         accepted_at = now()
   where id = v_invitation.id
     and status = 'pending';

  insert into public.parental_consents(
    student_profile_id,
    parent_profile_id,
    consent_type,
    consent_version
  )
  values (
    v_invitation.student_profile_id,
    v_parent.id,
    'account_and_data',
    p_consent_version
  )
  on conflict (student_profile_id, parent_profile_id, consent_type, consent_version)
  do nothing;

  return jsonb_build_object(
    'ok', true,
    'code', 'accepted',
    'student_id', v_student.id,
    'household_id', v_household_id
  );
end;
$$;

revoke all on function public.accept_parent_invitation_atomic(uuid, uuid, text) from public;
revoke all on function public.accept_parent_invitation_atomic(uuid, uuid, text) from anon;
revoke all on function public.accept_parent_invitation_atomic(uuid, uuid, text) from authenticated;
grant execute on function public.accept_parent_invitation_atomic(uuid, uuid, text) to service_role;
