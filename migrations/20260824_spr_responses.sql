-- Commercial support for digital SAT/PSAT Math student-produced responses (SPR).
-- Keeps existing MCQ rows compatible while allowing server-scored text/fraction/decimal answers.

alter table if exists public.practice_responses
  add column if not exists response_text text;
alter table if exists public.practice_responses
  alter column selected_answer drop not null;

do $$ begin
  alter table public.practice_responses
    add constraint practice_response_one_answer_shape
    check ((selected_answer is not null) <> (response_text is not null));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.practice_responses
    add constraint practice_response_text_length
    check (response_text is null or char_length(response_text) between 1 and 6);
exception when duplicate_object then null; end $$;

alter table if exists public.diagnostic_responses
  add column if not exists response_text text;
alter table if exists public.diagnostic_responses
  alter column selected_answer drop not null;
alter table if exists public.diagnostic_responses
  alter column correct_answer drop not null;

do $$ begin
  alter table public.diagnostic_responses
    add constraint diagnostic_response_one_answer_shape
    check ((selected_answer is not null) <> (response_text is not null));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.diagnostic_responses
    add constraint diagnostic_response_text_length
    check (response_text is null or char_length(response_text) between 1 and 6);
exception when duplicate_object then null; end $$;

comment on column public.practice_responses.response_text is 'Server-validated student-produced response. Null for MCQ rows.';
comment on column public.diagnostic_responses.response_text is 'Server-validated assessment student-produced response. Null for MCQ rows.';
