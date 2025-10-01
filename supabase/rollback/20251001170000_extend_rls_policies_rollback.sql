BEGIN;

-- Drop RLS policies
DROP POLICY IF EXISTS payments_admin_policy ON public.payments;
DROP POLICY IF EXISTS payments_manager_select ON public.payments;
DROP POLICY IF EXISTS payments_manager_insert ON public.payments;
DROP POLICY IF EXISTS payments_manager_update ON public.payments;
DROP POLICY IF EXISTS payments_staff_policy ON public.payments;

DROP POLICY IF EXISTS invoices_admin_policy ON public.invoices;
DROP POLICY IF EXISTS invoices_manager_select ON public.invoices;
DROP POLICY IF EXISTS invoices_manager_insert ON public.invoices;
DROP POLICY IF EXISTS invoices_manager_update ON public.invoices;
DROP POLICY IF EXISTS invoices_staff_policy ON public.invoices;

DROP POLICY IF EXISTS contacts_admin_policy ON public.contacts;
DROP POLICY IF EXISTS contacts_manager_select ON public.contacts;
DROP POLICY IF EXISTS contacts_manager_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_manager_update ON public.contacts;
DROP POLICY IF EXISTS contacts_staff_policy ON public.contacts;

DROP POLICY IF EXISTS survey_dispatch_admin_policy ON public.survey_dispatch;
DROP POLICY IF EXISTS survey_dispatch_manager_select ON public.survey_dispatch;
DROP POLICY IF EXISTS survey_dispatch_manager_insert ON public.survey_dispatch;
DROP POLICY IF EXISTS survey_dispatch_manager_update ON public.survey_dispatch;
DROP POLICY IF EXISTS survey_dispatch_staff_policy ON public.survey_dispatch;

DROP POLICY IF EXISTS documents_admin_policy ON public.documents;
DROP POLICY IF EXISTS documents_manager_select ON public.documents;
DROP POLICY IF EXISTS documents_manager_insert ON public.documents;
DROP POLICY IF EXISTS documents_manager_update ON public.documents;
DROP POLICY IF EXISTS documents_staff_policy ON public.documents;

-- Optionally disable RLS (not strictly necessary)
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_dispatch DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

COMMIT;
