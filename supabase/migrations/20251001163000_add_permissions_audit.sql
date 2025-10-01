BEGIN;

-- ===============================================
-- Step 1: Roles Enum
-- ===============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'staff', 'read_only');
  END IF;
END$$;

-- ===============================================
-- Step 2: Extend Users Table with Role
-- ===============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'staff';

-- ===============================================
-- Step 3: Harden Audit Log
-- ===============================================
-- Drop old audits table if exists, replace with proper audit_log
DROP TABLE IF EXISTS public.audit_log CASCADE;

CREATE TABLE public.audit_log (
  id SERIAL PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  action text NOT NULL,
  old_value_json jsonb,
  new_value_json jsonb,
  actor_id integer REFERENCES public.users(id),
  at timestamptz DEFAULT now()
);

-- Index for querying by entity and actor
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log (actor_id);

-- ===============================================
-- Step 4: Trigger Function for Auto-Audit
-- ===============================================
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (entity_type, entity_id, action, old_value_json, new_value_json, actor_id, at)
  VALUES (
    TG_TABLE_NAME,
    NEW.id,
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    current_setting('app.current_user_id', true)::int,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Example: attach to functions table
DROP TRIGGER IF EXISTS trg_audit_functions ON public.functions;
CREATE TRIGGER trg_audit_functions
AFTER INSERT OR UPDATE OR DELETE ON public.functions
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- ===============================================
-- Step 5: RLS Policies
-- ===============================================

-- Enable RLS if not already
ALTER TABLE public.functions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS functions_admin_policy ON public.functions;
DROP POLICY IF EXISTS functions_manager_select ON public.functions;
DROP POLICY IF EXISTS functions_manager_insert ON public.functions;
DROP POLICY IF EXISTS functions_manager_update ON public.functions;
DROP POLICY IF EXISTS functions_staff_policy ON public.functions;

-- Admins can do anything
CREATE POLICY functions_admin_policy
  ON public.functions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = current_setting('app.current_user_id', true)::int
        AND role = 'admin'
    )
  );

-- Managers: SELECT
CREATE POLICY functions_manager_select
  ON public.functions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = current_setting('app.current_user_id', true)::int
        AND role = 'manager'
    )
  );

-- Managers: INSERT
CREATE POLICY functions_manager_insert
  ON public.functions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = current_setting('app.current_user_id', true)::int
        AND role = 'manager'
    )
  );

-- Managers: UPDATE
CREATE POLICY functions_manager_update
  ON public.functions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = current_setting('app.current_user_id', true)::int
        AND role = 'manager'
    )
  );

-- Staff and Read-only: read only
CREATE POLICY functions_staff_policy
  ON public.functions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = current_setting('app.current_user_id', true)::int
        AND role IN ('staff','read_only')
    )
  );


COMMIT;
