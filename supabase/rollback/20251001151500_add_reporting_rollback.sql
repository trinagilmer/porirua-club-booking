BEGIN;

DROP MATERIALIZED VIEW IF EXISTS public.report_weekly_whats_on CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.report_monthly_financials CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.report_pipeline_forecast CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.report_survey_results CASCADE;

DROP INDEX IF EXISTS idx_functions_status;
DROP INDEX IF EXISTS idx_functions_event_start;

COMMIT;
