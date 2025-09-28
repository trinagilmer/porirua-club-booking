-- SQL Update Statement to update password_hash for user 'manager@poriruaclub.co.nz'

UPDATE users
SET password_hash = '$2b$10$APmItNeZO9TkCU4xik6jRur.ykrNPBqmtvseLBgaeHvRzzD2vrkIa'
WHERE username = 'manager@poriruaclub.co.nz';
