BEGIN;

-- Drop added columns
ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS reminder_at,
  DROP COLUMN IF EXISTS completed_at,
  DROP COLUMN IF EXISTS is_archived;

-- Drop indexes
DROP INDEX IF EXISTS idx_tasks_reminder_at;
DROP INDEX IF EXISTS idx_tasks_assigned_user;

COMMIT;
