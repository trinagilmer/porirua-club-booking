BEGIN;

-- ===============================
-- Extend Functions
-- ===============================
ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS contact_id integer REFERENCES public.contacts(id),
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes_internal text,
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS totals_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS totals_cost numeric DEFAULT 0;

-- ===============================
-- Extend Tasks
-- ===============================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- ===============================
-- Extend Invoices
-- ===============================
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_no text,
  ADD COLUMN IF NOT EXISTS issue_date timestamptz,
  ADD COLUMN IF NOT EXISTS due_date timestamptz,
  ADD COLUMN IF NOT EXISTS paid_to_date numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due numeric DEFAULT 0;

-- ===============================
-- Extend Payments
-- ===============================
-- Rename event_id to function_id if it exists
ALTER TABLE public.payments
  RENAME COLUMN event_id TO function_id;

-- Add missing fields
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS external_provider text,
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS memo text;

COMMIT;
