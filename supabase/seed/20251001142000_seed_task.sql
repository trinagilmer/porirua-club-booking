BEGIN;

INSERT INTO public.tasks (event_id, title, status, due_at, assigned_user_id, notes, reminder_at)
VALUES (
  1,  -- replace with an actual function_id
  'Confirm catering numbers',
  'open',
  now() + interval '3 days',
  NULL,
  'Reminder to call client and confirm catering numbers',
  now() + interval '2 days'
);

COMMIT;
