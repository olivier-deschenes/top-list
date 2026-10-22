-- Ratings move from 1 to 5 stars to a score out of 10 in half points
-- (1, 1.5, … 10). Existing ratings double, so 5 stars becomes 10/10 and every
-- ranking stays the same. SQLite can't change a CHECK, so the table is rebuilt.
PRAGMA defer_foreign_keys = true;

CREATE TABLE reviews_new (
  entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
  group_id TEXT NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE,
  rating REAL NOT NULL CHECK (
    rating BETWEEN 1 AND 10 AND rating * 2 = CAST(rating * 2 AS INTEGER)
  ),
  comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (entry_id, username),
  FOREIGN KEY (group_id, username) REFERENCES members (group_id, username) ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT INTO reviews_new (entry_id, group_id, username, rating, comment, created_at, updated_at)
SELECT entry_id, group_id, username, rating * 2, comment, created_at, updated_at
FROM reviews;

DROP TABLE reviews;
ALTER TABLE reviews_new RENAME TO reviews;
CREATE INDEX reviews_group_idx ON reviews (group_id);

-- The activity feed keeps the rating each review was saved with.
UPDATE activity
SET data = json_set(data, '$.rating', json_extract(data, '$.rating') * 2)
WHERE type = 'review.saved' AND json_extract(data, '$.rating') IS NOT NULL;
