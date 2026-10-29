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

CREATE TABLE IF NOT EXISTS daily_visitors (day TEXT NOT NULL, visitor_hash TEXT NOT NULL, PRIMARY KEY(day, visitor_hash));

CREATE TABLE IF NOT EXISTS reply_targets (
 message_id TEXT PRIMARY KEY REFERENCES messages(id),
 target_id TEXT REFERENCES messages(id)
);
INSERT OR IGNORE INTO reply_targets(message_id,target_id) SELECT message_id,parent_id FROM message_replies;
CREATE TRIGGER IF NOT EXISTS messages_delete_dependencies BEFORE DELETE ON messages BEGIN
 DELETE FROM message_likes WHERE message_id=OLD.id OR message_id IN (SELECT message_id FROM message_replies WHERE parent_id=OLD.id);
 DELETE FROM reply_targets WHERE message_id=OLD.id OR message_id IN (SELECT message_id FROM message_replies WHERE parent_id=OLD.id);
 UPDATE reply_targets SET target_id=NULL WHERE target_id=OLD.id OR target_id IN (SELECT message_id FROM message_replies WHERE parent_id=OLD.id);
 DELETE FROM messages WHERE id IN (SELECT message_id FROM message_replies WHERE parent_id=OLD.id);
 DELETE FROM message_replies WHERE message_id=OLD.id OR parent_id=OLD.id;
END;
