-- SATprep.io secure-v3 diagnostic finalization hardening.
-- Final diagnostic state, learner path, and diagnostic-derived mastery now commit atomically.

create or replace function public.finalize_diagnostic_attempt_secure_v3(
  p_attempt_id uuid,
  p_student_id uuid,
  p_completed_at timestamptz,
  p_math_score numeric,
  p_rw_score numeric,
  p_overall_score numeric,
  p_recommended_start text,
  p_summary jsonb,
  p_ranked jsonb
)
returns table(completed boolean, already_completed boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  a public.diagnostic_attempts%rowtype;
  s public.students%rowtype;
  v_total integer;
  v_answered integer;
  v_now timestamptz := coalesce(p_completed_at, now());
  x record;
begin
  select * into a
  from public.diagnostic_attempts
  where id = p_attempt_id and student_id = p_student_id
  for update;

  if not found then
    raise exception 'Diagnostic attempt not found';
  end if;

  if coalesce(a.summary->>'engine','legacy') <> 'secure-v3' then
    raise exception 'Only secure-v3 diagnostics may use atomic finalization';
  end if;

  if a.status = 'completed' then
    return query select true, true;
    return;
  end if;

  if a.status <> 'in_progress' then
    raise exception 'Diagnostic attempt is not active';
  end if;

  if p_math_score is null or p_rw_score is null or p_overall_score is null
     or p_math_score < 0 or p_math_score > 1
     or p_rw_score < 0 or p_rw_score > 1
     or p_overall_score < 0 or p_overall_score > 1 then
    raise exception 'Diagnostic score payload is invalid';
  end if;

  if jsonb_typeof(p_summary) <> 'object'
     or coalesce(p_summary->>'engine','') <> 'secure-v3' then
    raise exception 'Diagnostic summary payload is invalid';
  end if;

  if jsonb_typeof(p_ranked) <> 'array' then
    raise exception 'Diagnostic mastery payload is invalid';
  end if;

  v_total := jsonb_array_length(coalesce(a.summary->'question_plan','[]'::jsonb));
  if v_total <= 0 then
    raise exception 'Diagnostic question plan is empty';
  end if;

  select count(distinct dr.question_key)
    into v_answered
  from public.diagnostic_responses dr
  where dr.attempt_id = a.id
    and dr.student_id = p_student_id
    and dr.scored_by_server = true
    and dr.content_item_id is not null
    and dr.content_item_id = dr.question_key
    and exists (
      select 1
      from jsonb_array_elements_text(a.summary->'question_plan') q(item_id)
      where q.item_id = dr.question_key
    );

  if v_answered < v_total then
    return query select false, false;
    return;
  end if;

  select * into s
  from public.students
  where id = p_student_id
  for update;

  if not found then
    raise exception 'Diagnostic student not found';
  end if;

  update public.diagnostic_attempts
  set status = 'completed',
      completed_at = v_now,
      math_score = p_math_score,
      rw_score = p_rw_score,
      overall_score = p_overall_score,
      recommended_start = p_recommended_start,
      summary = p_summary
  where id = a.id;

  update public.students
  set diagnostic_completed_at = v_now,
      diagnostic_math_mastery = p_math_score,
      diagnostic_rw_mastery = p_rw_score,
      recommended_path = coalesce(s.recommended_path,'{}'::jsonb) || jsonb_build_object(
        'diagnostic', p_summary,
        'diagnostic_priority_skills', coalesce(p_summary->'priority_skills','[]'::jsonb),
        'diagnostic_strengths', coalesce(p_summary->'strengths','[]'::jsonb),
        'diagnostic_completed_at', to_jsonb(v_now)
      ),
      onboarding_complete = true
  where id = p_student_id;

  for x in
    select r.skill, r.mastery, r.items
    from jsonb_to_recordset(p_ranked) as r(skill text, mastery numeric, items integer)
  loop
    if x.skill is null or btrim(x.skill) = ''
       or x.mastery is null or x.mastery < 0 or x.mastery > 1
       or x.items is null or x.items <= 0 then
      raise exception 'Diagnostic mastery row is invalid';
    end if;

    insert into public.skill_mastery(student_id, skill_key, mastery, items_attempted, updated_at)
    values (p_student_id, x.skill, x.mastery, x.items, v_now)
    on conflict(student_id, skill_key) do update set
      mastery = excluded.mastery,
      items_attempted = excluded.items_attempted,
      updated_at = excluded.updated_at;
  end loop;

  return query select true, false;
end;
$$;

revoke all on function public.finalize_diagnostic_attempt_secure_v3(uuid,uuid,timestamptz,numeric,numeric,numeric,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.finalize_diagnostic_attempt_secure_v3(uuid,uuid,timestamptz,numeric,numeric,numeric,text,jsonb,jsonb) to service_role;

comment on function public.finalize_diagnostic_attempt_secure_v3(uuid,uuid,timestamptz,numeric,numeric,numeric,text,jsonb,jsonb)
is 'Atomically finalizes one secure-v3 diagnostic, locks the attempt/student, verifies all planned server-scored responses exist, and writes learner diagnostic/mastery state exactly once. Service-role only.';
