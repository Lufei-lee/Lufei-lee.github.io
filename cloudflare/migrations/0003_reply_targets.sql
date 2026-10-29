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
