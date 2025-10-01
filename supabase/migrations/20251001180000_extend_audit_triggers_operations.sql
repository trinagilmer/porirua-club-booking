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
-- Step 2: Attach Triggers to Operational Tables
-- ===============================================

-- Tasks
DROP TRIGGER IF EXISTS trg_audit_tasks ON public.tasks;
CREATE TRIGGER trg_audit_tasks
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Restaurant Bookings
DROP TRIGGER IF EXISTS trg_audit_restaurant_bookings ON public.restaurant_bookings;
CREATE TRIGGER trg_audit_restaurant_bookings
AFTER INSERT OR UPDATE OR DELETE ON public.restaurant_bookings
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Club Events
DROP TRIGGER IF EXISTS trg_audit_club_events ON public.club_events;
CREATE TRIGGER trg_audit_club_events
AFTER INSERT OR UPDATE OR DELETE ON public.club_events
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

COMMIT;
