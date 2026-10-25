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
