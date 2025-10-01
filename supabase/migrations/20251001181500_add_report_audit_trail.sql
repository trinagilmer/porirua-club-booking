BEGIN;

-- ===============================================
-- Audit Trail Report
-- ===============================================

-- Drop if already exists
DROP MATERIALIZED VIEW IF EXISTS public.report_audit_trail_recent;

-- Create a materialized view for admin-friendly reporting
CREATE MATERIALIZED VIEW public.report_audit_trail_recent AS
SELECT
  a.id,
  a.entity_type,
  a.entity_id,
  a.action,
  a.old_value_json,
  a.new_value_json,
  a.at,
  u.id   AS actor_id,
  u.name AS actor_name,
  u.email AS actor_email
FROM public.audit_log a
LEFT JOIN public.users u ON u.id = a.actor_id
ORDER BY a.at DESC
LIMIT 100;

-- Index to refresh quickly
CREATE INDEX idx_report_audit_trail_recent_at
  ON public.report_audit_trail_recent (at DESC);

COMMIT;
