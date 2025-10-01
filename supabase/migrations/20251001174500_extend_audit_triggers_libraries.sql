BEGIN;

-- ===============================================
-- Step 1: Ensure Audit Trigger Function Exists
-- ===============================================
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    entity_type,
    entity_id,
    action,
    old_value_json,
    new_value_json,
    actor_id,
    at
  )
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    current_setting('app.current_user_id', true)::int,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- Step 2: Attach Triggers to Library Tables
-- ===============================================

-- Rooms
DROP TRIGGER IF EXISTS trg_audit_rooms ON public.rooms;
CREATE TRIGGER trg_audit_rooms
AFTER INSERT OR UPDATE OR DELETE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Menus
DROP TRIGGER IF EXISTS trg_audit_menus ON public.menus;
CREATE TRIGGER trg_audit_menus
AFTER INSERT OR UPDATE OR DELETE ON public.menus
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Menu Items
DROP TRIGGER IF EXISTS trg_audit_menu_items ON public.menu_items;
CREATE TRIGGER trg_audit_menu_items
AFTER INSERT OR UPDATE OR DELETE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Services
DROP TRIGGER IF EXISTS trg_audit_services ON public.services;
CREATE TRIGGER trg_audit_services
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Staff Roles
DROP TRIGGER IF EXISTS trg_audit_staff_roles ON public.staff_roles;
CREATE TRIGGER trg_audit_staff_roles
AFTER INSERT OR UPDATE OR DELETE ON public.staff_roles
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

COMMIT;
