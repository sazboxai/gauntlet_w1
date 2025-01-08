-- Add reaction_count to direct_messages table
ALTER TABLE public.direct_messages
ADD COLUMN IF NOT EXISTS reaction_count INTEGER DEFAULT 0;

-- Update the message_reactions table to support direct messages
ALTER TABLE public.message_reactions
ADD COLUMN IF NOT EXISTS direct_message_id UUID REFERENCES public.direct_messages(id) ON DELETE CASCADE;

-- Update the trigger function to handle direct messages
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.message_id IS NOT NULL THEN
      UPDATE public.channel_messages
      SET reaction_count = reaction_count + 1
      WHERE id = NEW.message_id;
    ELSIF NEW.direct_message_id IS NOT NULL THEN
      UPDATE public.direct_messages
      SET reaction_count = reaction_count + 1
      WHERE id = NEW.direct_message_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.message_id IS NOT NULL THEN
      UPDATE public.channel_messages
      SET reaction_count = reaction_count - 1
      WHERE id = OLD.message_id;
    ELSIF OLD.direct_message_id IS NOT NULL THEN
      UPDATE public.direct_messages
      SET reaction_count = reaction_count - 1
      WHERE id = OLD.direct_message_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is updated
DROP TRIGGER IF EXISTS update_reaction_count_trigger ON public.message_reactions;
CREATE TRIGGER update_reaction_count_trigger
AFTER INSERT OR DELETE ON public.message_reactions
FOR EACH ROW
EXECUTE FUNCTION update_reaction_count();

