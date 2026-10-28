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
