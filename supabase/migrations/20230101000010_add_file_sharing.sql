-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Update messages table
ALTER TABLE public.messages
ADD COLUMN has_attachments BOOLEAN DEFAULT FALSE,
ADD COLUMN attachment_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_message_id ON public.files(message_id);
CREATE INDEX idx_files_channel_id ON public.files(channel_id);
CREATE INDEX idx_files_created_at ON public.files(created_at);
CREATE INDEX idx_files_mime_type ON public.files(mime_type);

-- Grant access to authenticated users
GRANT ALL ON public.files TO authenticated;

-- Enable RLS on files table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create policies for files table
CREATE POLICY "Users can insert their own files"
ON public.files FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view files in their channels"
ON public.files FOR SELECT
USING (
  channel_id IN (
    SELECT channel_id FROM public.channel_memberships
    WHERE user_id = auth.uid()
  )
  OR
  message_id IN (
    SELECT id FROM public.messages
    WHERE channel_id IN (
      SELECT channel_id FROM public.channel_memberships
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own files"
ON public.files FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
ON public.files FOR DELETE
USING (auth.uid() = user_id);

