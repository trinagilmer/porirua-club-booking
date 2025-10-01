BEGIN;

-- Drop updated reports
DROP MATERIALIZED VIEW IF EXISTS public.report_audit_trail_recent;
DROP VIEW IF EXISTS public.report_audit_trail_live;

-- Restore original reports with direct join
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

CREATE INDEX idx_report_audit_trail_recent_at
  ON public.report_audit_trail_recent (at DESC);

CREATE VIEW public.report_audit_trail_live AS
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

COMMIT;
