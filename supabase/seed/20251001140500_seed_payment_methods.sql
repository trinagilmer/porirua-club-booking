BEGIN;

-- No dedicated providers table yet, but you can store standard labels in app code.
-- If you decide to normalize providers later, we can add a library table.

-- Example: Insert a "cash" payment row for testing
INSERT INTO public.payments (function_id, external_provider, method, amount, currency, status, memo, purpose)
VALUES (1, 'manual', 'cash', 100, 'NZD', 'succeeded', 'Test seed payment', 'deposit')
ON CONFLICT DO NOTHING;

COMMIT;
