BEGIN;

-- Step 1: Remove triggers
DROP TRIGGER IF EXISTS trg_audit_functions ON public.functions;
DROP FUNCTION IF EXISTS public.fn_audit_trigger;

-- Step 2: Drop audit_log
DROP TABLE IF EXISTS public.audit_log;

-- Step 3: Drop policies
DROP POLICY IF EXISTS functions_admin_policy ON public.functions;
DROP POLICY IF EXISTS functions_manager_policy ON public.functions;
DROP POLICY IF EXISTS functions_staff_policy ON public.functions;

-- Step 4: Drop role enum from users
ALTER TABLE public.users DROP COLUMN IF EXISTS role;

DROP TYPE IF EXISTS public.user_role;

COMMIT;
