BEGIN;

-- Drop new columns
ALTER TABLE public.payments
  DROP COLUMN IF EXISTS external_provider,
  DROP COLUMN IF EXISTS external_ref,
  DROP COLUMN IF EXISTS method,
  DROP COLUMN IF EXISTS memo,
  DROP COLUMN IF EXISTS purpose;

-- Rename function_id back to event_id if necessary
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

-- Drop index
DROP INDEX IF EXISTS idx_payments_function_id;

COMMIT;
