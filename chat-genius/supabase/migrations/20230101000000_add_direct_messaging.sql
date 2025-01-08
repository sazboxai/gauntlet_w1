-- Modify existing users table
ALTER TABLE users
ADD COLUMN current_session_id TEXT;

-- Create direct_messages table
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create typing_status table
CREATE TABLE typing_status (
  user_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipient_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_direct_messages_sender_receiver ON direct_messages(sender_id, receiver_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at);
CREATE INDEX idx_typing_status_user_recipient ON typing_status(user_id, recipient_id);

