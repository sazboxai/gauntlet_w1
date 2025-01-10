-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS direct_messages_sender_receiver_idx ON public.direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS direct_messages_created_at_idx ON public.direct_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own messages"
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view messages they sent or received"
ON public.direct_messages FOR SELECT
USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can update their own messages"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Grant necessary permissions
GRANT ALL ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

