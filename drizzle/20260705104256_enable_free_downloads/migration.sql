-- Custom SQL migration file, put your code below! --
-- Allow media downloads on the Free plan (so anyone who can view a trip can
-- download its photos/media). Pro/Business already allow downloads.
UPDATE plans SET allow_downloads = true WHERE code = 'free';