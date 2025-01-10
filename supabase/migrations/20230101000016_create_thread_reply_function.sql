-- Create a function to handle thread reply creation and stats update
CREATE OR REPLACE FUNCTION public.create_thread_reply(
  p_parent_message_id UUID,
  p_content TEXT,
  p_sender_id UUID,
  p_channel_id UUID,
  p_has_attachments BOOLEAN
) RETURNS SETOF channel_messages AS $$
DECLARE
  v_new_message_id UUID;
BEGIN
  -- Insert the new reply
  INSERT INTO channel_messages (
    content,
    sender_id,
    parent_message_id,
    channel_id,
    has_attachments
  ) VALUES (
    p_content,
    p_sender_id,
    p_parent_message_id,
    p_channel_id,
    p_has_attachments
  )
  RETURNING id INTO v_new_message_id;

  -- Update thread participants
  INSERT INTO thread_participants (message_id, user_id)
  VALUES (p_parent_message_id, p_sender_id)
  ON CONFLICT (message_id, user_id) DO NOTHING;

  -- Update reply count and last reply timestamp
  UPDATE channel_messages
  SET 
    reply_count = COALESCE(reply_count, 0) + 1,
    last_reply_at = NOW()
  WHERE id = p_parent_message_id;

  -- Return the newly created message
  RETURN QUERY
  SELECT *
  FROM channel_messages
  WHERE id = v_new_message_id;
END;
$$ LANGUAGE plpgsql;

-- Add reply_count and last_reply_at columns to channel_messages if they don't exist
ALTER TABLE channel_messages
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMPTZ;

-- Create an index on parent_message_id for better performance
CREATE INDEX IF NOT EXISTS idx_channel_messages_parent_message_id
ON channel_messages (parent_message_id);

-- Ensure the thread_participants table exists
CREATE TABLE IF NOT EXISTS thread_participants (
  message_id UUID REFERENCES channel_messages(id),
  user_id UUID REFERENCES users(id),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

