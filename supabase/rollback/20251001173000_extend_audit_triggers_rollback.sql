BEGIN;

-- Drop audit triggers for core tables
DROP TRIGGER IF EXISTS trg_audit_payments ON public.payments;
DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;
DROP TRIGGER IF EXISTS trg_audit_contacts ON public.contacts;
DROP TRIGGER IF EXISTS trg_audit_survey_dispatch ON public.survey_dispatch;
DROP TRIGGER IF EXISTS trg_audit_documents ON public.documents;

COMMIT;
