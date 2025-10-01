BEGIN;

-- Insert a simple NPS survey
INSERT INTO public.surveys (name, is_active, json_schema)
VALUES (
  'Post-Event NPS',
  true,
  '{
    "questions": [
      {
        "type": "scale",
        "label": "How likely are you to recommend us to a friend?",
        "min": 0,
        "max": 10
      },
      {
        "type": "text",
        "label": "What was the highlight of your event?"
      },
      {
        "type": "text",
        "label": "What could we improve?"
      }
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;

COMMIT;
