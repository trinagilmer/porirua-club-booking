BEGIN;

-- ===============================
-- Step 1: Audit Columns for Menu Tables
-- ===============================

ALTER TABLE public.menu_categories
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

ALTER TABLE public.menu_items
  DROP CONSTRAINT IF EXISTS menu_items_unit_check;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_unit_check
  CHECK (unit = ANY (ARRAY['per_person','plate','tray','bottle','other']));

ALTER TABLE public.menu_item_prices
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- ===============================
-- Step 2: New Core Tables
-- ===============================

CREATE TABLE IF NOT EXISTS public.contacts (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.function_status_history (
  id SERIAL PRIMARY KEY,
  function_id integer NOT NULL REFERENCES public.functions(id) ON DELETE CASCADE,
  from_status text,
  to_status text,
  changed_by integer REFERENCES public.users(id),
  changed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.function_items (
  id SERIAL PRIMARY KEY,
  function_id integer NOT NULL REFERENCES public.functions(id) ON DELETE CASCADE,
  item_type text CHECK (item_type = ANY (ARRAY['room','menu','service','staff','custom'])),
  ref_id integer,
  description text,
  qty numeric NOT NULL DEFAULT 1,
  unit_price numeric DEFAULT 0,
  unit_cost numeric DEFAULT 0,
  tax_rate numeric DEFAULT 0,
  line_total_price numeric DEFAULT 0,
  line_total_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.survey_dispatch (
  id SERIAL PRIMARY KEY,
  function_id integer NOT NULL REFERENCES public.functions(id) ON DELETE CASCADE,
  survey_id integer NOT NULL REFERENCES public.surveys(id),
  sent_at timestamptz,
  sent_by integer REFERENCES public.users(id),
  email_to text,
  link_token text UNIQUE,
  responded_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.documents (
  id SERIAL PRIMARY KEY,
  function_id integer NOT NULL REFERENCES public.functions(id) ON DELETE CASCADE,
  kind text CHECK (kind = ANY (ARRAY['contract','run_sheet','photo','layout','other'])),
  file_name text NOT NULL,
  file_path text NOT NULL,
  uploaded_by integer REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_events (
  id SERIAL PRIMARY KEY,
  title text NOT NULL,
  room_id integer REFERENCES public.rooms(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text CHECK (status = ANY (ARRAY['planned','published','completed','cancelled'])) DEFAULT 'planned',
  visibility_public boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

-- ===============================
-- Step 3: Library Tables
-- ===============================

CREATE TABLE IF NOT EXISTS public.services (
  id SERIAL PRIMARY KEY,
  name text NOT NULL UNIQUE,
  code text,
  default_price numeric,
  default_cost numeric,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.staff_roles (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  default_price numeric,
  default_cost numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

COMMIT;


