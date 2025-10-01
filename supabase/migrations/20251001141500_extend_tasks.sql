BEGIN;

-- ===============================
-- Extend Tasks Table
-- ===============================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz,       -- when reminder should fire
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,      -- timestamp when completed
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false; -- archive old tasks

-- Add useful index for reminders
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_at
  ON public.tasks(reminder_at)
  WHERE status = 'open';

-- Add useful index for assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user
  ON public.tasks(assigned_user_id);

COMMIT;
