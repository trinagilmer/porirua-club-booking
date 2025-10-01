BEGIN;

-- ===============================================
-- Step 1: Enable RLS
-- ===============================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- Step 2: Drop Existing Policies (if any)
-- ===============================================
-- Payments
DROP POLICY IF EXISTS payments_admin_policy ON public.payments;
DROP POLICY IF EXISTS payments_manager_select ON public.payments;
DROP POLICY IF EXISTS payments_manager_insert ON public.payments;
DROP POLICY IF EXISTS payments_manager_update ON public.payments;
DROP POLICY IF EXISTS payments_staff_policy ON public.payments;

-- Invoices
DROP POLICY IF EXISTS invoices_admin_policy ON public.invoices;
DROP POLICY IF EXISTS invoices_manager_select ON public.invoices;
DROP POLICY IF EXISTS invoices_manager_insert ON public.invoices;
DROP POLICY IF EXISTS invoices_manager_update ON public.invoices;
DROP POLICY IF EXISTS invoices_staff_policy ON public.invoices;

-- Contacts
DROP POLICY IF EXISTS contacts_admin_policy ON public.contacts;
DROP POLICY IF EXISTS contacts_manager_select ON public.contacts;
DROP POLICY IF EXISTS contacts_manager_insert ON public.contacts;
DROP POLICY IF EXISTS contacts_manager_update ON public.contacts;
DROP POLICY IF EXISTS contacts_staff_policy ON public.contacts;

-- Survey Dispatch
DROP POLICY IF EXISTS survey_dispatch_admin_policy ON public.survey_dispatch;
DROP POLICY IF EXISTS survey_dispatch_manager_select ON public.survey_dispatch;
DROP POLICY IF EXISTS survey_dispatch_manager_insert ON public.survey_dispatch;
DROP POLICY IF EXISTS survey_dispatch_manager_update ON public.survey_dispatch;
DROP POLICY IF EXISTS survey_dispatch_staff_policy ON public.survey_dispatch;

-- Documents
DROP POLICY IF EXISTS documents_admin_policy ON public.documents;
DROP POLICY IF EXISTS documents_manager_select ON public.documents;
DROP POLICY IF EXISTS documents_manager_insert ON public.documents;
DROP POLICY IF EXISTS documents_manager_update ON public.documents;
DROP POLICY IF EXISTS documents_staff_policy ON public.documents;

-- ===============================================
-- Step 3: Apply New Policies (Admin/Manager/Staff)
-- ===============================================

-- Template: Admin (ALL)
-- Managers (SELECT, INSERT, UPDATE)
-- Staff/Read-only (SELECT)

-- Payments
CREATE POLICY payments_admin_policy
  ON public.payments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'admin'));

CREATE POLICY payments_manager_select
  ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY payments_manager_insert
  ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY payments_manager_update
  ON public.payments
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY payments_staff_policy
  ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role IN ('staff','read_only')));

-- Repeat for Invoices
CREATE POLICY invoices_admin_policy
  ON public.invoices
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'admin'));

CREATE POLICY invoices_manager_select
  ON public.invoices
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY invoices_manager_insert
  ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY invoices_manager_update
  ON public.invoices
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY invoices_staff_policy
  ON public.invoices
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role IN ('staff','read_only')));

-- Repeat for Contacts
CREATE POLICY contacts_admin_policy
  ON public.contacts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'admin'));

CREATE POLICY contacts_manager_select
  ON public.contacts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY contacts_manager_insert
  ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY contacts_manager_update
  ON public.contacts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY contacts_staff_policy
  ON public.contacts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role IN ('staff','read_only')));

-- Repeat for Survey Dispatch
CREATE POLICY survey_dispatch_admin_policy
  ON public.survey_dispatch
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'admin'));

CREATE POLICY survey_dispatch_manager_select
  ON public.survey_dispatch
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY survey_dispatch_manager_insert
  ON public.survey_dispatch
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY survey_dispatch_manager_update
  ON public.survey_dispatch
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY survey_dispatch_staff_policy
  ON public.survey_dispatch
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role IN ('staff','read_only')));

-- Repeat for Documents
CREATE POLICY documents_admin_policy
  ON public.documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'admin'));

CREATE POLICY documents_manager_select
  ON public.documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY documents_manager_insert
  ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY documents_manager_update
  ON public.documents
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role = 'manager'));

CREATE POLICY documents_staff_policy
  ON public.documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id', true)::int AND role IN ('staff','read_only')));

COMMIT;
