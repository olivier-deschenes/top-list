-- Photos of an entry. The image bytes live in R2 (PHOTOS binding) under
-- "<id>/full" and "<id>/thumb"; this table holds who added them and their size.
CREATE TABLE photos (
  id TEXT PRIMARY KEY NOT NULL,
  entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
  group_id TEXT NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (group_id, username) REFERENCES members (group_id, username) ON UPDATE CASCADE
);

CREATE INDEX photos_group_idx ON photos (group_id);
CREATE INDEX photos_entry_idx ON photos (entry_id);
