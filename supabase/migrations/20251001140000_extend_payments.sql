BEGIN;

-- ===============================
-- Payments Table Enhancements
-- ===============================

-- Rename column event_id → function_id if not already renamed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE public.payments
      RENAME COLUMN event_id TO function_id;
  END IF;
END $$;

-- Add provider fields
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS external_provider text,   -- e.g. stripe, windcave, polipay
  ADD COLUMN IF NOT EXISTS external_ref text,        -- session/intent id from provider
  ADD COLUMN IF NOT EXISTS method text,              -- card, bank_transfer, cash, etc.
  ADD COLUMN IF NOT EXISTS memo text,                -- freeform notes
  ADD COLUMN IF NOT EXISTS purpose text CHECK (purpose IN ('deposit','invoice')) DEFAULT 'invoice';

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_payments_function_id
  ON public.payments(function_id);

COMMIT;
