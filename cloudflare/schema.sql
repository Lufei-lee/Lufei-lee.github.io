CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '' CHECK(length(name) <= 40),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected'))
);
CREATE INDEX IF NOT EXISTS messages_public ON messages(status, created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
  fingerprint TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_expiry ON rate_limits(expires_at);

-- Additive migration: existing messages and moderation status are preserved.
CREATE TABLE IF NOT EXISTS message_replies (
 message_id TEXT PRIMARY KEY REFERENCES messages(id),
 parent_id TEXT NOT NULL REFERENCES messages(id),
 CHECK(message_id <> parent_id)
);
CREATE INDEX IF NOT EXISTS message_replies_parent ON message_replies(parent_id);
CREATE TABLE IF NOT EXISTS message_likes (
 message_id TEXT NOT NULL REFERENCES messages(id),
 visitor_hash TEXT NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY(message_id, visitor_hash)
);
