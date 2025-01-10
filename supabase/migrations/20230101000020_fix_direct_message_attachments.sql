-- Check if the direct_message_attachments table exists
CREATE TABLE IF NOT EXISTS public.direct_message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_message_attachments_message_id ON public.direct_message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_direct_message_attachments_file_id ON public.direct_message_attachments(file_id);

-- Grant necessary permissions
GRANT ALL ON TABLE public.direct_message_attachments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE direct_message_attachments_id_seq TO authenticated;

