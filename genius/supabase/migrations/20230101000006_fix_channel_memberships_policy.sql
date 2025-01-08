-- Drop existing policies on channel_memberships
DROP POLICY IF EXISTS "Users can view channel memberships" ON public.channel_memberships;

-- Create new policies for channel_memberships
CREATE POLICY "Users can view public channel memberships"
  ON public.channel_memberships FOR SELECT
  USING (
    (SELECT is_private FROM public.channels WHERE id = channel_memberships.channel_id) = false
  );

CREATE POLICY "Users can view their own channel memberships"
  ON public.channel_memberships FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can join public channels"
  ON public.channel_memberships FOR INSERT
  WITH CHECK (
    (SELECT is_private FROM public.channels WHERE id = channel_id) = false
  );

CREATE POLICY "Channel admins can manage memberships"
  ON public.channel_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.channel_memberships
      WHERE channel_id = channel_memberships.channel_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

