BEGIN;

WITH chosen_function AS (
  SELECT id
  FROM public.functions
  WHERE event_name = 'Seed Test Event'
  ORDER BY id DESC
  LIMIT 1
),
chosen_survey AS (
  SELECT id
  FROM public.surveys
  WHERE name = 'Post-Event NPS'
  LIMIT 1
)
-- Response with score
INSERT INTO public.survey_dispatch (function_id, survey_id, email_to, sent_at, responded_at, response)
SELECT
  (SELECT id FROM chosen_function),
  (SELECT id FROM chosen_survey),
  'guest1@example.com',
  now() - interval '2 days',
  now() - interval '1 day',
  '{"score": 9, "comment": "Amazing event!"}'::jsonb
ON CONFLICT DO NOTHING;

WITH chosen_function AS (
  SELECT id
  FROM public.functions
  WHERE event_name = 'Seed Test Event'
  ORDER BY id DESC
  LIMIT 1
),
chosen_survey AS (
  SELECT id
  FROM public.surveys
  WHERE name = 'Post-Event NPS'
  LIMIT 1
)
-- Response without score
INSERT INTO public.survey_dispatch (function_id, survey_id, email_to, sent_at)
SELECT
  (SELECT id FROM chosen_function),
  (SELECT id FROM chosen_survey),
  'guest2@example.com',
  now() - interval '1 day'
ON CONFLICT DO NOTHING;

COMMIT;
