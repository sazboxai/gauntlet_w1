-- Remove the existing foreign key constraint
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_message_id_fkey;

-- Add a new foreign key constraint for channel_messages
ALTER TABLE files
ADD CONSTRAINT files_channel_message_id_fkey
FOREIGN KEY (message_id)
REFERENCES channel_messages(id)
ON DELETE SET NULL;

-- Add a new column for direct messages (if needed)
ALTER TABLE files
ADD COLUMN direct_message_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL;

-- Update the files table to use channel_id instead of message_id for channel files
UPDATE files
SET channel_id = (SELECT channel_id FROM channel_messages WHERE channel_messages.id = files.message_id)
WHERE message_id IS NOT NULL;

-- Remove the message_id from files that are associated with channels
UPDATE files
SET message_id = NULL
WHERE channel_id IS NOT NULL;

