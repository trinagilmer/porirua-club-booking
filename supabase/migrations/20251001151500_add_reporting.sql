BEGIN;

-- ===============================
-- Operational Reports
-- ===============================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.report_weekly_whats_on AS
SELECT
  f.id AS function_id,
  f.event_name AS title,
  f.event_start AS start_at,
  f.event_end AS end_at,
  'function' AS type,
  f.status
FROM public.functions f
UNION
SELECT
  c.id AS event_id,
  c.title,
  c.start_at,
  c.end_at,
  'club_event' AS type,
  c.status
FROM public.club_events c
WITH NO DATA;

-- ===============================
-- Financial Reports
-- ===============================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.report_monthly_financials AS
SELECT
  DATE_TRUNC('month', f.event_start) AS month,
  SUM(f.totals_price) AS total_sales,
  SUM(f.totals_cost) AS total_cost,
  SUM(f.totals_price - f.totals_cost) AS margin
FROM public.functions f
WHERE f.status IN ('confirmed','deposit_paid','invoiced','completed')
GROUP BY 1
WITH NO DATA;

-- Pipeline Forecast (pending/confirmed by month)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.report_pipeline_forecast AS
SELECT
  DATE_TRUNC('month', f.event_start) AS month,
  SUM(CASE WHEN f.status IN ('lead','pending') THEN f.totals_price ELSE 0 END) AS pipeline_value,
  SUM(CASE WHEN f.status IN ('confirmed','deposit_paid','invoiced') THEN f.totals_price ELSE 0 END) AS confirmed_value
FROM public.functions f
GROUP BY 1
WITH NO DATA;

-- ===============================
-- Quality Reports
-- ===============================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.report_survey_results AS
SELECT
  s.id AS survey_id,
  s.name,
  COUNT(d.id) AS responses,
  AVG((d.response->>'score')::numeric) AS avg_score
FROM public.surveys s
LEFT JOIN public.survey_dispatch d
  ON d.survey_id = s.id AND d.responded_at IS NOT NULL
GROUP BY s.id, s.name
WITH NO DATA;

-- ===============================
-- Indexing
-- ===============================
CREATE INDEX IF NOT EXISTS idx_functions_status ON public.functions(status);
CREATE INDEX IF NOT EXISTS idx_functions_event_start ON public.functions(event_start);

COMMIT;
