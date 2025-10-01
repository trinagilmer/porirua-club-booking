BEGIN;

-- Drop audit triggers for operational tables
DROP TRIGGER IF EXISTS trg_audit_tasks ON public.tasks;
DROP TRIGGER IF EXISTS trg_audit_restaurant_bookings ON public.restaurant_bookings;
DROP TRIGGER IF EXISTS trg_audit_club_events ON public.club_events;

COMMIT;
