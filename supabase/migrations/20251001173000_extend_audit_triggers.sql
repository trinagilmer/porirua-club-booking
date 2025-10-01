BEGIN;

-- ===============================================
-- Step 1: Reusable Audit Trigger Function
-- ===============================================
-- Already exists from functions, but ensure it's defined
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
    TG_TABLE_NAME,       -- entity_type = table name
    COALESCE(NEW.id, OLD.id), -- entity_id = new or old row id
    TG_OP,               -- action = INSERT / UPDATE / DELETE
    to_jsonb(OLD),
    to_jsonb(NEW),
    current_setting('app.current_user_id', true)::int,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- Step 2: Attach Triggers to Core Tables
-- ===============================================

-- Payments
DROP TRIGGER IF EXISTS trg_audit_payments ON public.payments;
CREATE TRIGGER trg_audit_payments
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Invoices
DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;
CREATE TRIGGER trg_audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Contacts
DROP TRIGGER IF EXISTS trg_audit_contacts ON public.contacts;
CREATE TRIGGER trg_audit_contacts
AFTER INSERT OR UPDATE OR DELETE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Survey Dispatch
DROP TRIGGER IF EXISTS trg_audit_survey_dispatch ON public.survey_dispatch;
CREATE TRIGGER trg_audit_survey_dispatch
AFTER INSERT OR UPDATE OR DELETE ON public.survey_dispatch
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- Documents
DROP TRIGGER IF EXISTS trg_audit_documents ON public.documents;
CREATE TRIGGER trg_audit_documents
AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

COMMIT;
