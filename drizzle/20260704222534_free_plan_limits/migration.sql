-- Free plan limits: 3 trips, 2 GB per trip/event, 200 MB max upload, 20 members.
-- (max_events=3 and 2 GB storage were already seeded; update file size + members.)
UPDATE plans
SET max_file_size_bytes = 209715200,   -- 200 MB
    max_members_per_event = 20
WHERE code = 'free';
