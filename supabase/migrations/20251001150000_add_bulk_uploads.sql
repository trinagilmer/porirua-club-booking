BEGIN;

-- ===============================
-- Bulk Upload Tracking Table
-- ===============================

CREATE TABLE IF NOT EXISTS public.bulk_uploads (
  id SERIAL PRIMARY KEY,
  upload_type text NOT NULL CHECK (upload_type IN ('rooms','menus','services','staff_roles')),
  file_name text NOT NULL,
  uploaded_by integer REFERENCES public.users(id),
  status text CHECK (status IN ('pending','processing','completed','failed')) DEFAULT 'pending',
  row_count integer DEFAULT 0,
  error_log text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ===============================
-- Audit Logging (reuse audit_log)
-- ===============================

-- Index for faster filtering of audit logs
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON public.audit_log(entity_type, entity_id);

COMMIT;
