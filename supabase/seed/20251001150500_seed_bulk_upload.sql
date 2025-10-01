BEGIN;

INSERT INTO public.bulk_uploads (upload_type, file_name, uploaded_by, status, row_count)
VALUES ('rooms', 'rooms_seed.csv', 1, 'completed', 3)
ON CONFLICT DO NOTHING;

COMMIT;
