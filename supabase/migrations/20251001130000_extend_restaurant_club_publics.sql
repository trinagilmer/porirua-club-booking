BEGIN;

-- ===============================
-- Restaurant Bookings (align with spec)
-- ===============================

-- Rename table if needed (Supabase currently has restaurant_reservations)
ALTER TABLE public.restaurant_reservations
  RENAME TO restaurant_bookings;

-- Add missing columns to match spec
ALTER TABLE public.restaurant_bookings
  ADD COLUMN IF NOT EXISTS contact_id integer REFERENCES public.contacts(id),
  ADD COLUMN IF NOT EXISTS party_size integer,
  ADD COLUMN IF NOT EXISTS table_id text, -- generic, supports number or area
  ADD COLUMN IF NOT EXISTS start_at timestamptz,
  ADD COLUMN IF NOT EXISTS end_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text CHECK (status = ANY (ARRAY['requested','confirmed','seated','no_show','cancelled'])) DEFAULT 'requested',
  ADD COLUMN IF NOT EXISTS notes text;

-- ===============================
-- Club Events (already created in Step 3, extend if needed)
-- ===============================
ALTER TABLE public.club_events
  ADD COLUMN IF NOT EXISTS visibility_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- ===============================
-- Public Enquiry Form
-- ===============================
-- Reuse leads table as base; extend to match function enquiry form needs
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS desired_start timestamptz,
  ADD COLUMN IF NOT EXISTS desired_end timestamptz,
  ADD COLUMN IF NOT EXISTS room_pref_id integer REFERENCES public.rooms(id);

COMMIT;
