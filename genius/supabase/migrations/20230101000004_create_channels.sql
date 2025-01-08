-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create channels table
CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_name CHECK (char_length(name) >= 3 AND char_length(name) <= 50)
);

-- Create channel_memberships table
CREATE TABLE public.channel_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member', 'admin')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, user_id)
);

-- Create channel_messages table
CREATE TABLE public.channel_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_threaded BOOLEAN DEFAULT false,
    thread_id UUID REFERENCES public.channel_messages(id) ON DELETE CASCADE,
    CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- Create channel_typing_status table
CREATE TABLE public.channel_typing_status (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, channel_id)
);

-- Create indexes
CREATE INDEX idx_channel_messages_channel_id ON public.channel_messages(channel_id);
CREATE INDEX idx_channel_messages_created_at ON public.channel_messages(created_at);
CREATE INDEX idx_channel_memberships_user_id ON public.channel_memberships(user_id);
CREATE INDEX idx_channel_memberships_channel_id ON public.channel_memberships(channel_id);

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_typing_status ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Channels
CREATE POLICY "Users can view public channels"
    ON public.channels FOR SELECT
    USING (NOT is_private OR EXISTS (
        SELECT 1 FROM public.channel_memberships
        WHERE channel_id = channels.id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can create channels"
    ON public.channels FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Channel admins can update channels"
    ON public.channels FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.channel_memberships
        WHERE channel_id = id AND user_id = auth.uid() AND role = 'admin'
    ));

-- Channel Memberships
CREATE POLICY "Users can view channel memberships"
    ON public.channel_memberships FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.channel_memberships
        WHERE channel_id = channel_memberships.channel_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can join public channels"
    ON public.channel_memberships FOR INSERT
    WITH CHECK (
        NOT EXISTS (
            SELECT 1 FROM public.channels
            WHERE id = channel_id AND is_private = true
        ) OR EXISTS (
            SELECT 1 FROM public.channel_memberships
            WHERE channel_id = channel_memberships.channel_id 
            AND user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Channel Messages
CREATE POLICY "Users can view messages in their channels"
    ON public.channel_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.channel_memberships
        WHERE channel_id = channel_messages.channel_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can send messages to their channels"
    ON public.channel_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.channel_memberships
        WHERE channel_id = channel_messages.channel_id AND user_id = auth.uid()
    ));

-- Channel Typing Status
CREATE POLICY "Users can update their typing status"
    ON public.channel_typing_status FOR ALL
    USING (user_id = auth.uid());

