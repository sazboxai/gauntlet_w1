-- Drop existing policies on channel_memberships
DROP POLICY IF EXISTS "Users can view channel memberships" ON public.channel_memberships;
DROP POLICY IF EXISTS "Users can view public channel memberships" ON public.channel_memberships;
DROP POLICY IF EXISTS "Users can view their own channel memberships" ON public.channel_memberships;
DROP POLICY IF EXISTS "Users can join public channels" ON public.channel_memberships;
DROP POLICY IF EXISTS "Channel admins can manage memberships" ON public.channel_memberships;

-- Create new policies for channel_memberships
CREATE POLICY "Users can view public channel memberships"
  ON public.channel_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.channels
      WHERE id = channel_memberships.channel_id AND is_private = false
    )
  );

CREATE POLICY "Users can view their own channel memberships"
  ON public.channel_memberships FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can join public channels"
  ON public.channel_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.channels
      WHERE id = channel_id AND is_private = false
    )
  );

CREATE POLICY "Channel admins can manage memberships"
  ON public.channel_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_memberships AS cm
      WHERE cm.channel_id = channel_memberships.channel_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

