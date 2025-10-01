BEGIN;

-- Refresh all reporting views
REFRESH MATERIALIZED VIEW CONCURRENTLY public.report_weekly_whats_on;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.report_monthly_financials;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.report_pipeline_forecast;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.report_survey_results;

COMMIT;
