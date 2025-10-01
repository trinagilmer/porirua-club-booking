BEGIN;

-- ===============================
-- Function Enquiries (extend leads table)
-- ===============================

-- Already extended in Step 5 with desired_start, desired_end, room_pref_id, status.
-- Add optional pricing exposure toggle.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS pricing_exposed boolean DEFAULT false;

-- ===============================
-- Restaurant Booking Rules
-- ===============================

-- Capacity rules per slot/area
CREATE TABLE IF NOT EXISTS public.restaurant_booking_rules (
  id SERIAL PRIMARY KEY,
  area text NOT NULL,                        -- e.g. 'main_dining', 'patio'
  slot_start time NOT NULL,
  slot_end time NOT NULL,
  max_capacity integer NOT NULL,
  blackout_dates daterange,                  -- optional, block specific ranges
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===============================
-- Public Club Calendar Extensions
-- ===============================

-- Ensure club_events already has visibility_public
ALTER TABLE public.club_events
  ADD COLUMN IF NOT EXISTS public_description text; -- shorter description for public calendar

COMMIT;
