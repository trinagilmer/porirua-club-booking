BEGIN;

-- ===============================
-- Surveys Table Enhancements
-- ===============================

ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS json_schema jsonb,         -- survey definition
  ADD COLUMN IF NOT EXISTS email_template_id integer REFERENCES public.email_templates(id);

-- ===============================
-- Survey Dispatch Table
-- ===============================

CREATE TABLE IF NOT EXISTS public.survey_dispatch (
  id SERIAL PRIMARY KEY,
  function_id integer NOT NULL REFERENCES public.functions(id) ON DELETE CASCADE,
  survey_id integer NOT NULL REFERENCES public.surveys(id),
  sent_at timestamptz,
  sent_by integer REFERENCES public.users(id),
  email_to text,
  link_token text UNIQUE,      -- one-time token
  responded_at timestamptz
);

-- Index for quick lookup by function
CREATE INDEX IF NOT EXISTS idx_survey_dispatch_function
  ON public.survey_dispatch(function_id);

COMMIT;
