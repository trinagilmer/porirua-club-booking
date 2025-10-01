BEGIN;

-- ===============================
-- Rollback Email Templates
-- ===============================
ALTER TABLE public.email_templates
  DROP COLUMN IF EXISTS subject,
  DROP COLUMN IF EXISTS body_html,
  DROP COLUMN IF EXISTS body_text,
  DROP COLUMN IF EXISTS enabled;

ALTER TABLE public.email_templates
  DROP CONSTRAINT IF EXISTS email_templates_key_unique;

-- ===============================
-- Rollback Audit Log
-- ===============================
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- ===============================
-- Rollback Event Index
-- ===============================
DROP INDEX IF EXISTS idx_function_status_history_function;

COMMIT;
