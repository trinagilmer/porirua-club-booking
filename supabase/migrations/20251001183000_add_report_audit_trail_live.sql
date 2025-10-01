BEGIN;

-- ===============================================
-- Live Audit Trail View
-- ===============================================

-- Drop if already exists
DROP VIEW IF EXISTS public.report_audit_trail_live;

-- Create a live view (always queries audit_log directly)
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
