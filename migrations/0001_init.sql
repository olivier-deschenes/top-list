-- Top List schema. Timestamps are unix epoch milliseconds.
-- Usernames compare case-insensitively ("Olivier" and "olivier" are one person).

CREATE TABLE groups (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE members (
  group_id TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  username TEXT NOT NULL COLLATE NOCASE,
  joined_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  PRIMARY KEY (group_id, username)
);

CREATE TABLE entries (
  id TEXT PRIMARY KEY NOT NULL,
  group_id TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  url TEXT,
  tags TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  created_by TEXT NOT NULL COLLATE NOCASE,
  updated_by TEXT COLLATE NOCASE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (group_id, created_by) REFERENCES members (group_id, username) ON UPDATE CASCADE,
  FOREIGN KEY (group_id, updated_by) REFERENCES members (group_id, username) ON UPDATE CASCADE
);

CREATE INDEX entries_group_idx ON entries (group_id);

CREATE TABLE reviews (
  entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
  group_id TEXT NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (entry_id, username),
  FOREIGN KEY (group_id, username) REFERENCES members (group_id, username) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX reviews_group_idx ON reviews (group_id);

-- History of who did what. entry_id has no foreign key so history survives deletes.
CREATE TABLE activity (
  id TEXT PRIMARY KEY NOT NULL,
  group_id TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  username TEXT NOT NULL COLLATE NOCASE,
  type TEXT NOT NULL,
  entry_id TEXT,
  entry_name TEXT,
  data TEXT, -- JSON object, shape depends on type
  created_at INTEGER NOT NULL,
  FOREIGN KEY (group_id, username) REFERENCES members (group_id, username) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX activity_group_created_idx ON activity (group_id, created_at DESC, id DESC);
