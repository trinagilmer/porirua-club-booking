BEGIN;

-- Rollback surveys table extensions
ALTER TABLE public.surveys
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS json_schema,
  DROP COLUMN IF EXISTS email_template_id;

-- Drop survey_dispatch
DROP TABLE IF EXISTS public.survey_dispatch CASCADE;

-- Drop index
DROP INDEX IF EXISTS idx_survey_dispatch_function;

COMMIT;
