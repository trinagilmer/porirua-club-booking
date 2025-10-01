BEGIN;

-- Rollback Function Enquiries
ALTER TABLE public.leads
  DROP COLUMN IF EXISTS pricing_exposed;

-- Drop Restaurant Booking Rules
DROP TABLE IF EXISTS public.restaurant_booking_rules CASCADE;

-- Rollback Club Events
ALTER TABLE public.club_events
  DROP COLUMN IF EXISTS public_description;

COMMIT;
