BEGIN;

-- ===============================
-- Rollback Restaurant Bookings
-- ===============================
ALTER TABLE public.restaurant_bookings
  DROP COLUMN IF EXISTS contact_id,
  DROP COLUMN IF EXISTS party_size,
  DROP COLUMN IF EXISTS table_id,
  DROP COLUMN IF EXISTS start_at,
  DROP COLUMN IF EXISTS end_at,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS notes;

-- Rename back if needed
ALTER TABLE public.restaurant_bookings
  RENAME TO restaurant_reservations;

-- ===============================
-- Rollback Club Events
-- ===============================
ALTER TABLE public.club_events
  DROP COLUMN IF EXISTS visibility_public,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS is_archived;

-- ===============================
-- Rollback Leads / Public Enquiry
-- ===============================
ALTER TABLE public.leads
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS desired_start,
  DROP COLUMN IF EXISTS desired_end,
  DROP COLUMN IF EXISTS room_pref_id;

COMMIT;

++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++