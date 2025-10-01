BEGIN;

-- Step 1: Remove Audit Columns from Menu Tables
ALTER TABLE public.menu_categories
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS is_archived;

ALTER TABLE public.menu_items
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS is_archived;

ALTER TABLE public.menu_items
  DROP CONSTRAINT IF EXISTS menu_items_unit_check;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_unit_check
  CHECK (unit = ANY (ARRAY['per_person','plate','tray']));

ALTER TABLE public.menu_item_prices
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS is_archived;

-- Step 2: Drop Core Tables
DROP TABLE IF EXISTS public.function_status_history CASCADE;
DROP TABLE IF EXISTS public.function_items CASCADE;
DROP TABLE IF EXISTS public.survey_dispatch CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.club_events CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;

-- Step 3: Drop Library Tables
DROP TABLE IF EXISTS public.staff_roles CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;

COMMIT;
