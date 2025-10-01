BEGIN;

-- Drop bulk uploads table
DROP TABLE IF EXISTS public.bulk_uploads CASCADE;

-- Drop audit log index
DROP INDEX IF EXISTS idx_audit_log_entity;

COMMIT;
