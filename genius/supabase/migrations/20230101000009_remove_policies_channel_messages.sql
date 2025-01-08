-- Drop existing policies on channel_messages
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.channel_messages;
DROP POLICY IF EXISTS "Users can send messages to their channels" ON public.channel_messages;

-- Remove RLS from channel_messages
ALTER TABLE public.channel_messages DISABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT ALL ON public.channel_messages TO authenticated;

