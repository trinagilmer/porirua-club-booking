BEGIN;

-- Extend survey_dispatch with a JSONB response column
ALTER TABLE public.survey_dispatch
  ADD COLUMN IF NOT EXISTS response jsonb;

COMMIT;
