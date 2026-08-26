-- SATprep.io secure guided-practice response hardening.
-- Serializes each practice session, validates the persisted plan, binds the session to the
-- trusted student ID, and makes repeated identical submissions idempotent.

create or replace function public.submit_practice_response_secure_v3(
  p_session_id uuid,
  p_student_id uuid,
  p_position integer,
  p_item_id text,
  p_selected_answer integer,
  p_response_text text,
  p_is_correct boolean,
  p_response_ms integer
)
returns table(accepted boolean, idempotent boolean, answered integer, total integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  s public.practice_sessions%rowtype;
  ci public.content_items%rowtype;
  prior public.practice_responses%rowtype;
  v_expected text;
  v_total integer;
  v_answered integer;
begin
  select * into s
  from public.practice_sessions
  where id = p_session_id and student_id = p_student_id
  for update;

  if not found then
    raise exception 'Practice session not found';
  end if;

  select count(*) into v_total
  from public.practice_session_items psi
  where psi.session_id = s.id;

  if v_total <= 0 then
    raise exception 'Practice question plan is empty';
  end if;

  if p_position is null or p_position < 0 or p_position >= v_total then
    raise exception 'Practice question position is invalid';
  end if;

  select psi.item_id into v_expected
  from public.practice_session_items psi
  where psi.session_id = s.id and psi.position = p_position;

  if v_expected is null or v_expected <> p_item_id then
    raise exception 'Practice question does not match the persisted plan';
  end if;

  select * into ci
  from public.content_items
  where id = p_item_id
    and content_type = 'practice'
    and qa_status = 'production_approved'
    and active = true;

  if not found then
    raise exception 'Practice content item is not production-approved and active';
  end if;

  if ci.skill_key <> s.skill_key then
    raise exception 'Practice content item does not match the session skill';
  end if;

  if p_is_correct is null then
    raise exception 'Practice scoring result is required';
  end if;

  if ci.format = 'mcq' then
    if p_selected_answer is null or p_response_text is not null
       or jsonb_typeof(ci.choices) <> 'array'
       or p_selected_answer < 0
       or p_selected_answer >= jsonb_array_length(ci.choices) then
      raise exception 'Practice multiple-choice response is invalid';
    end if;
  elsif ci.format = 'spr' then
    if p_selected_answer is not null
       or p_response_text is null
       or btrim(p_response_text) = ''
       or length(p_response_text) > 6 then
      raise exception 'Practice student-produced response is invalid';
    end if;
  else
    raise exception 'Practice response format is unsupported';
  end if;

  select * into prior
  from public.practice_responses pr
  where pr.session_id = s.id
    and pr.student_id = p_student_id
    and pr.item_id = p_item_id
    and pr.scored_by_server = true
  limit 1;

  if found then
    if prior.position is distinct from p_position
       or prior.selected_answer is distinct from p_selected_answer
       or prior.response_text is distinct from p_response_text
       or prior.is_correct is distinct from p_is_correct then
      raise exception 'Practice question was already submitted and cannot be changed';
    end if;

    select count(*) into v_answered
    from public.practice_responses pr
    where pr.session_id = s.id
      and pr.student_id = p_student_id
      and pr.scored_by_server = true;

    return query select true, true, v_answered, v_total;
    return;
  end if;

  if s.status <> 'in_progress' then
    raise exception 'Practice session is not active';
  end if;

  select count(*) into v_answered
  from public.practice_responses pr
  where pr.session_id = s.id
    and pr.student_id = p_student_id
    and pr.scored_by_server = true;

  if p_position <> v_answered then
    raise exception 'Practice response is out of sequence; continue from position %', v_answered;
  end if;

  insert into public.practice_responses(
    session_id,
    student_id,
    item_id,
    position,
    selected_answer,
    response_text,
    is_correct,
    response_ms,
    scored_by_server
  ) values (
    s.id,
    p_student_id,
    p_item_id,
    p_position,
    p_selected_answer,
    p_response_text,
    p_is_correct,
    greatest(0, least(3600000, coalesce(p_response_ms,0))),
    true
  );

  v_answered := v_answered + 1;
  return query select true, false, v_answered, v_total;
end;
$$;

revoke all on function public.submit_practice_response_secure_v3(uuid,uuid,integer,text,integer,text,boolean,integer) from public, anon, authenticated;
grant execute on function public.submit_practice_response_secure_v3(uuid,uuid,integer,text,integer,text,boolean,integer) to service_role;

comment on function public.submit_practice_response_secure_v3(uuid,uuid,integer,text,integer,text,boolean,integer)
is 'Atomically records one trusted guided-practice response. Locks and owner-binds the session, verifies the persisted plan and active production-approved content, enforces sequence, and makes identical retries idempotent. Service-role only.';
