BEGIN;

-- ======================================
-- Seed Surveys
-- ======================================

-- Post-Event NPS Survey
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

-- Catering Feedback Survey
INSERT INTO public.surveys (name, is_active, json_schema)
VALUES (
  'Catering Feedback',
  true,
  '{
    "questions": [
      {
        "type": "scale",
        "label": "How satisfied were you with the catering?",
        "min": 1,
        "max": 5
      },
      {
        "type": "multiple_choice",
        "label": "Which meal options did you try?",
        "choices": ["Buffet", "Plated Dinner", "Finger Food", "Dessert Table"]
      },
      {
        "type": "text",
        "label": "Any additional comments?"
      }
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Venue & Staff Feedback Survey
INSERT INTO public.surveys (name, is_active, json_schema)
VALUES (
  'Venue & Staff Feedback',
  true,
  '{
    "questions": [
      {
        "type": "scale",
        "label": "How would you rate the venue facilities?",
        "min": 1,
        "max": 5
      },
      {
        "type": "scale",
        "label": "How would you rate the professionalism of our staff?",
        "min": 1,
        "max": 5
      },
      {
        "type": "text",
        "label": "Please share any suggestions to improve your experience."
      }
    ]
  }'::jsonb
)
ON CONFLICT DO NOTHING;

COMMIT;
