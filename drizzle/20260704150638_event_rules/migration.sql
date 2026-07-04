-- Business-rule triggers, functions, view, and plan seed data.
-- These cannot be expressed in Drizzle's schema DSL, so they live in this
-- hand-written migration (registered in the journal, applied by drizzle-kit).
--
-- Note: `updated_at` is maintained at the app layer via Drizzle's $onUpdate
-- (see the schema), so the SQL set_updated_at triggers are intentionally omitted.
-- The `user` table is Better Auth's; `user.plan_id -> plans.id`.

-- On event creation, add the creator as an 'owner' member.
CREATE OR REPLACE FUNCTION add_creator_as_owner() RETURNS trigger AS $$
BEGIN
  INSERT INTO event_members (event_id, user_id, role, status)
  VALUES (NEW.id, NEW.creator_id, 'owner', 'approved')
  ON CONFLICT (event_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_events_add_owner AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION add_creator_as_owner();
--> statement-breakpoint

-- Keep events.storage_used_bytes in sync as media is added / resized / removed.
CREATE OR REPLACE FUNCTION sync_event_storage() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE events SET storage_used_bytes = storage_used_bytes + NEW.file_size_bytes WHERE id = NEW.event_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE events SET storage_used_bytes = storage_used_bytes - OLD.file_size_bytes WHERE id = OLD.event_id;
  ELSIF (TG_OP = 'UPDATE' AND NEW.file_size_bytes <> OLD.file_size_bytes) THEN
    UPDATE events SET storage_used_bytes = storage_used_bytes - OLD.file_size_bytes + NEW.file_size_bytes
      WHERE id = NEW.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_media_sync_storage
  AFTER INSERT OR UPDATE OF file_size_bytes OR DELETE ON media
  FOR EACH ROW EXECUTE FUNCTION sync_event_storage();
--> statement-breakpoint

-- Enforce plan quotas on upload: allowed type, single-file cap, per-event storage cap.
CREATE OR REPLACE FUNCTION enforce_media_quota() RETURNS trigger AS $$
DECLARE
  p    plans%ROWTYPE;
  used BIGINT;
BEGIN
  SELECT pl.* INTO p
    FROM events e
    JOIN "user" u ON u.id = e.creator_id
    JOIN plans pl ON pl.id = u.plan_id
   WHERE e.id = NEW.event_id;

  IF p.id IS NULL THEN
    RETURN NEW;  -- creator has no plan assigned yet; skip enforcement
  END IF;

  IF NOT (NEW.media_type = ANY (p.allowed_media_types)) THEN
    RAISE EXCEPTION 'media type % not allowed on plan %', NEW.media_type, p.code;
  END IF;

  IF NEW.file_size_bytes > p.max_file_size_bytes THEN
    RAISE EXCEPTION 'file (% bytes) exceeds plan % max file size (% bytes)',
      NEW.file_size_bytes, p.code, p.max_file_size_bytes;
  END IF;

  SELECT storage_used_bytes INTO used FROM events WHERE id = NEW.event_id;
  IF used + NEW.file_size_bytes > p.max_storage_per_event_bytes THEN
    RAISE EXCEPTION 'event storage cap (% bytes) exceeded (used %, adding %)',
      p.max_storage_per_event_bytes, used, NEW.file_size_bytes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_media_enforce_quota BEFORE INSERT ON media
  FOR EACH ROW EXECUTE FUNCTION enforce_media_quota();
--> statement-breakpoint

-- Enforce plan's max members per event (owners don't consume a seat).
CREATE OR REPLACE FUNCTION enforce_member_cap() RETURNS trigger AS $$
DECLARE
  cap INTEGER;
  cnt INTEGER;
BEGIN
  IF NEW.role = 'owner' OR NEW.status <> 'approved' THEN
    RETURN NEW;  -- owners and pending/blocked rows don't count toward the cap
  END IF;

  SELECT pl.max_members_per_event INTO cap
    FROM events e
    JOIN "user" u ON u.id = e.creator_id
    JOIN plans pl ON pl.id = u.plan_id
   WHERE e.id = NEW.event_id;

  IF cap IS NULL THEN
    RETURN NEW;  -- unlimited (or creator has no plan)
  END IF;

  SELECT count(*) INTO cnt
    FROM event_members
   WHERE event_id = NEW.event_id
     AND status = 'approved'
     AND role <> 'owner'
     AND user_id <> NEW.user_id;

  IF cnt >= cap THEN
    RAISE EXCEPTION 'event % has reached its member cap of %', NEW.event_id, cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_event_members_cap BEFORE INSERT OR UPDATE OF status, role ON event_members
  FOR EACH ROW EXECUTE FUNCTION enforce_member_cap();
--> statement-breakpoint

-- Helper view: per-event stats (member_count excludes the owner).
CREATE OR REPLACE VIEW v_event_stats AS
SELECT
  e.id                AS event_id,
  e.name,
  e.visibility,
  e.storage_used_bytes,
  COUNT(m.*) FILTER (WHERE m.status = 'approved' AND m.role <> 'owner') AS member_count,
  (SELECT COUNT(*) FROM media md WHERE md.event_id = e.id)              AS media_count
FROM events e
LEFT JOIN event_members m ON m.event_id = e.id
GROUP BY e.id;
--> statement-breakpoint

-- Seed the 3 plans (⚠ ADJUST — only Free's 2 GB/event was specified).
INSERT INTO plans (code, name, price_cents, max_events, max_members_per_event,
                   max_storage_per_event_bytes, max_file_size_bytes,
                   allowed_media_types, allow_downloads) VALUES
  ('free',     'Free',     0,       3,    25,
     2147483648,       -- 2 GB per event
     104857600,        -- 100 MB max file
     ARRAY['image']::media_type[],
     false),
  ('pro',      'Pro',      1900,    50,   500,
     53687091200,      -- 50 GB per event
     2147483648,       -- 2 GB max file
     ARRAY['image','video','audio','document']::media_type[],
     true),
  ('business', 'Business', 9900,    NULL, 10000,
     536870912000,     -- 500 GB per event
     10737418240,      -- 10 GB max file
     ARRAY['image','video','audio','document','other']::media_type[],
     true)
ON CONFLICT (code) DO NOTHING;
