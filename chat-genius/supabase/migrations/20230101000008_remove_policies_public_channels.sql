-- Drop existing policies on channels
DROP POLICY IF EXISTS "Users can view public channels" ON public.channels;
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Channel admins can update channels" ON public.channels;

-- Drop existing policies on channel_memberships
DROP POLICY IF EXISTS "Users can view public channel memberships" ON public.channel_memberships;
DROP POLICY IF EXISTS "Users can view their own channel memberships" ON public.channel_memberships;
DROP POLICY IF EXISTS "Users can join public channels" ON public.channel_memberships;
DROP POLICY IF EXISTS "Channel admins can manage memberships" ON public.channel_memberships;

-- Remove RLS from channels and channel_memberships
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_memberships DISABLE ROW LEVEL SECURITY;

-- Remove is_private column from channels
ALTER TABLE public.channels DROP COLUMN IF EXISTS is_private;

-- Grant access to authenticated users
GRANT ALL ON public.channels TO authenticated;
GRANT ALL ON public.channel_memberships TO authenticated;

