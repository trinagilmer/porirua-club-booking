BEGIN;

-- Drop audit triggers for library tables
DROP TRIGGER IF EXISTS trg_audit_rooms ON public.rooms;
DROP TRIGGER IF EXISTS trg_audit_menus ON public.menus;
DROP TRIGGER IF EXISTS trg_audit_menu_items ON public.menu_items;
DROP TRIGGER IF EXISTS trg_audit_services ON public.services;
DROP TRIGGER IF EXISTS trg_audit_staff_roles ON public.staff_roles;

COMMIT;
