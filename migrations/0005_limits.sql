-- Caps on what an entry or a group can hold, enforced by the database so
-- requests racing each other can't slip past a count checked beforehand.
-- Keep the numbers in step with PHOTOS.perEntry and LIMITS in
-- src/lib/schemas.ts. Each RAISE message names its cap, which
-- src/server/db.server.ts turns into a translated error.

CREATE TRIGGER photos_per_entry BEFORE INSERT ON photos
WHEN (SELECT COUNT(*) FROM photos WHERE entry_id = NEW.entry_id) >= 24
BEGIN
  SELECT RAISE(ABORT, 'limit:photos_per_entry');
END;

CREATE TRIGGER entries_per_group BEFORE INSERT ON entries
WHEN (SELECT COUNT(*) FROM entries WHERE group_id = NEW.group_id) >= 500
BEGIN
  SELECT RAISE(ABORT, 'limit:entries_per_group');
END;

-- Every write upserts its member, so existing members must still get through.
CREATE TRIGGER members_per_group BEFORE INSERT ON members
WHEN NOT EXISTS (
    SELECT 1 FROM members WHERE group_id = NEW.group_id AND username = NEW.username
  )
  AND (SELECT COUNT(*) FROM members WHERE group_id = NEW.group_id) >= 200
BEGIN
  SELECT RAISE(ABORT, 'limit:members_per_group');
END;
