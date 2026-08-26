-- SATprep.io secure-v3 diagnostic answer-submission hardening.
-- Serializes each attempt, validates the persisted plan, and makes repeated identical submissions idempotent.

create or replace function public.submit_diagnostic_response_secure_v3(
  p_attempt_id uuid,
  p_student_id uuid,
  p_position integer,
  p_question_key text,
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
  a public.diagnostic_attempts%rowtype;
  ci public.content_items%rowtype;
  prior public.diagnostic_responses%rowtype;
  v_expected text;
  v_total integer;
  v_answered integer;
begin
  select * into a
  from public.diagnostic_attempts
  where id = p_attempt_id and student_id = p_student_id
  for update;

  if not found then
    raise exception 'Diagnostic attempt not found';
  end if;

  if coalesce(a.summary->>'engine','legacy') <> 'secure-v3' then
    raise exception 'Only secure-v3 diagnostics may use atomic response submission';
  end if;

  v_total := jsonb_array_length(coalesce(a.summary->'question_plan','[]'::jsonb));
  if v_total <= 0 then
    raise exception 'Diagnostic question plan is empty';
  end if;

  if p_position is null or p_position < 0 or p_position >= v_total then
    raise exception 'Diagnostic question position is invalid';
  end if;

  v_expected := a.summary->'question_plan'->>p_position;
  if v_expected is null or v_expected <> p_question_key then
    raise exception 'Diagnostic question does not match the persisted plan';
  end if;

  perform 1
  from public.diagnostic_attempt_items dai
  where dai.attempt_id = a.id
    and dai.position = p_position
    and dai.item_id = p_question_key;
  if not found then
    raise exception 'Diagnostic persisted plan item could not be verified';
  end if;

  select * into ci
  from public.content_items
  where id = p_question_key
    and content_type = 'diagnostic'
    and qa_status = 'production_approved'
    and active = true;
  if not found then
    raise exception 'Diagnostic content item is not production-approved and active';
  end if;

  if p_is_correct is null then
    raise exception 'Diagnostic scoring result is required';
  end if;

  if ci.format = 'mcq' then
    if p_selected_answer is null or p_response_text is not null
       or jsonb_typeof(ci.choices) <> 'array'
       or p_selected_answer < 0
       or p_selected_answer >= jsonb_array_length(ci.choices) then
      raise exception 'Diagnostic multiple-choice response is invalid';
    end if;
  elsif ci.format = 'spr' then
    if p_selected_answer is not null
       or p_response_text is null
       or btrim(p_response_text) = ''
       or length(p_response_text) > 6 then
      raise exception 'Diagnostic student-produced response is invalid';
    end if;
  else
    raise exception 'Diagnostic response format is unsupported';
  end if;

  select * into prior
  from public.diagnostic_responses dr
  where dr.attempt_id = a.id
    and dr.student_id = p_student_id
    and dr.question_key = p_question_key
    and dr.scored_by_server = true
  limit 1;

  if found then
    if prior.content_item_id is distinct from p_question_key
       or prior.selected_answer is distinct from p_selected_answer
       or prior.response_text is distinct from p_response_text
       or prior.is_correct is distinct from p_is_correct then
      raise exception 'Diagnostic question was already submitted and cannot be changed';
    end if;

    select count(distinct dr.question_key)
      into v_answered
    from public.diagnostic_responses dr
    where dr.attempt_id = a.id
      and dr.student_id = p_student_id
      and dr.scored_by_server = true
      and dr.content_item_id = dr.question_key
      and exists (
        select 1
        from jsonb_array_elements_text(a.summary->'question_plan') q(item_id)
        where q.item_id = dr.question_key
      );

    return query select true, true, v_answered, v_total;
    return;
  end if;

  if a.status <> 'in_progress' then
    raise exception 'Diagnostic attempt is not active';
  end if;

  select count(distinct dr.question_key)
    into v_answered
  from public.diagnostic_responses dr
  where dr.attempt_id = a.id
    and dr.student_id = p_student_id
    and dr.scored_by_server = true
    and dr.content_item_id = dr.question_key
    and exists (
      select 1
      from jsonb_array_elements_text(a.summary->'question_plan') q(item_id)
      where q.item_id = dr.question_key
    );

  if p_position <> v_answered then
    raise exception 'Diagnostic response is out of sequence; continue from position %', v_answered;
  end if;

  insert into public.diagnostic_responses(
    attempt_id,
    student_id,
    question_key,
    content_item_id,
    domain,
    skill_key,
    difficulty,
    selected_answer,
    response_text,
    correct_answer,
    is_correct,
    response_ms,
    scored_by_server
  ) values (
    a.id,
    p_student_id,
    p_question_key,
    p_question_key,
    ci.domain_key,
    ci.skill_key,
    ci.difficulty,
    p_selected_answer,
    p_response_text,
    p_selected_answer,
    p_is_correct,
    greatest(0, least(3600000, coalesce(p_response_ms,0))),
    true
  );

  v_answered := v_answered + 1;
  return query select true, false, v_answered, v_total;
end;
$$;

revoke all on function public.submit_diagnostic_response_secure_v3(uuid,uuid,integer,text,integer,text,boolean,integer) from public, anon, authenticated;
grant execute on function public.submit_diagnostic_response_secure_v3(uuid,uuid,integer,text,integer,text,boolean,integer) to service_role;

comment on function public.submit_diagnostic_response_secure_v3(uuid,uuid,integer,text,integer,text,boolean,integer)
is 'Atomically records one trusted secure-v3 diagnostic response. Locks the attempt, verifies the persisted question plan and active production-approved content, enforces sequence, and makes identical retries idempotent. Service-role only; the response row intentionally does not persist the protected answer key.';