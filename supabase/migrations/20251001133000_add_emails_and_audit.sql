BEGIN;

-- ===============================
-- Email Templates
-- ===============================
-- Extend existing email_templates table if it exists
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS body_text text,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

-- Ensure key is unique (manual guard, since IF NOT EXISTS not allowed on constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'email_templates_key_unique'
  ) THEN
    ALTER TABLE public.email_templates
      ADD CONSTRAINT email_templates_key_unique UNIQUE (key);
  END IF;
END $$;

-- ===============================
-- Audit Log
-- ===============================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id SERIAL PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  action text NOT NULL,
  old_value_json jsonb,
  new_value_json jsonb,
  actor_id integer REFERENCES public.users(id),
  at timestamptz DEFAULT now()
);

-- ===============================
-- Event scaffolding: index
-- ===============================
CREATE INDEX IF NOT EXISTS idx_function_status_history_function
  ON public.function_status_history(function_id);

COMMIT;

