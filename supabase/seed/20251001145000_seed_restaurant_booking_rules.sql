BEGIN;

INSERT INTO public.restaurant_booking_rules (area, slot_start, slot_end, max_capacity, blackout_dates)
VALUES
  ('main_dining', '18:00', '20:00', 40, NULL),
  ('main_dining', '20:00', '22:00', 40, NULL),
  ('patio', '18:00', '22:00', 20, daterange('2025-12-24', '2025-12-26'))
ON CONFLICT DO NOTHING;

COMMIT;
