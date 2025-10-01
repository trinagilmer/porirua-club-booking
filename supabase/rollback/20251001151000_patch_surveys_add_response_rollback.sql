BEGIN;

ALTER TABLE public.survey_dispatch
  DROP COLUMN IF EXISTS response;

COMMIT;
