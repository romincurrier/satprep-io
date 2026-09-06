-- Track the human-review batch associated with each commercial content item.
-- Batch A = authored before the first human calibration/review begins.
-- Batch B+ = authored after testing/review begins. This field is required on import.

alter table public.content_items
  add column if not exists review_batch text;

alter table public.content_items
  drop constraint if exists content_items_review_batch_check;

alter table public.content_items
  add constraint content_items_review_batch_check
  check (review_batch is null or review_batch ~ '^[A-Z][A-Z0-9_-]{0,31}$');

comment on column public.content_items.review_batch is
  'Human-review authoring batch. Batch A contains content authored before first human calibration/review begins; later authored content uses Batch B or subsequent labels. Must be explicitly populated before reviewed content is imported.';
