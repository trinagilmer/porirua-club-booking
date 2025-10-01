BEGIN;

-- ===============================
-- Rollback Functions
-- ===============================
ALTER TABLE public.functions
  DROP COLUMN IF EXISTS contact_id,
  DROP COLUMN IF EXISTS status_changed_at,
  DROP COLUMN IF EXISTS notes_internal,
  DROP COLUMN IF EXISTS terms_version,
  DROP COLUMN IF EXISTS totals_price,
  DROP COLUMN IF EXISTS totals_cost;

-- ===============================
-- Rollback Tasks
-- ===============================
ALTER TABLE public.tasks
  DROP COLUMN IF EXISTS reminder_at,
  DROP COLUMN IF EXISTS completed_at;

-- ===============================
-- Rollback Invoices
-- ===============================
ALTER TABLE public.invoices
  DROP COLUMN IF EXISTS invoice_no,
  DROP COLUMN IF EXISTS issue_date,
  DROP COLUMN IF EXISTS due_date,
  DROP COLUMN IF EXISTS paid_to_date,
  DROP COLUMN IF EXISTS balance_due;

-- ===============================
-- Rollback Payments
-- ===============================
ALTER TABLE public.payments
  DROP COLUMN IF EXISTS external_provider,
  DROP COLUMN IF EXISTS external_ref,
  DROP COLUMN IF EXISTS method,
  DROP COLUMN IF EXISTS memo;

-- Rename function_id back to event_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'function_id'
  ) THEN
    ALTER TABLE public.payments
      RENAME COLUMN function_id TO event_id;
  END IF;
END $$;

COMMIT;
