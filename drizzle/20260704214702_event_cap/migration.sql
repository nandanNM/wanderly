-- Enforce the creator's plan.max_events limit when a new event is created.
-- NULL max_events (or no plan) means unlimited.
CREATE OR REPLACE FUNCTION enforce_event_cap() RETURNS trigger AS $$
DECLARE
  cap INTEGER;
  cnt INTEGER;
BEGIN
  SELECT pl.max_events INTO cap
    FROM "user" u
    JOIN plans pl ON pl.id = u.plan_id
   WHERE u.id = NEW.creator_id;

  IF cap IS NULL THEN
    RETURN NEW;  -- unlimited, or creator has no plan assigned
  END IF;

  SELECT count(*) INTO cnt FROM events WHERE creator_id = NEW.creator_id;

  IF cnt >= cap THEN
    RAISE EXCEPTION 'event limit reached: your plan allows % event(s)', cap;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_events_enforce_cap BEFORE INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION enforce_event_cap();
