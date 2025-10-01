BEGIN;

-- ===============================================
-- Update Audit Reports to Use users_audit_view
-- ===============================================

-- Drop and recreate materialized view
DROP MATERIALIZED VIEW IF EXISTS public.report_audit_trail_recent;
CREATE MATERIALIZED VIEW public.report_audit_trail_recent AS
SELECT
  id,
  entity_type,
  entity_id,
  action,
  old_value_json,
  new_value_json,
  at,
  actor_id,
  actor_name,
  actor_email
FROM public.users_audit_view
ORDER BY at DESC
LIMIT 100;

-- Index to speed up refresh
CREATE INDEX idx_report_audit_trail_recent_at
  ON public.report_audit_trail_recent (at DESC);

-- Drop and recreate live view
DROP VIEW IF EXISTS public.report_audit_trail_live;
CREATE VIEW public.report_audit_trail_live AS
SELECT
  id,
  entity_type,
  entity_id,
  action,
  old_value_json,
  new_value_json,
  at,
  actor_id,
  actor_name,
  actor_email
FROM public.users_audit_view
ORDER BY at DESC
LIMIT 100;

COMMIT;
