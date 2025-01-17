-- Create a function to handle channel creation and membership in a single transaction
CREATE OR REPLACE FUNCTION create_channel_with_membership(
  p_name TEXT,
  p_description TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  members_count BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  -- Start transaction
  BEGIN
    -- Insert new channel
    INSERT INTO channels (name, description, created_by)
    VALUES (p_name, p_description, p_user_id)
    RETURNING id INTO v_channel_id;

    -- Insert channel membership for the creator
    INSERT INTO channel_memberships (channel_id, user_id, role)
    VALUES (v_channel_id, p_user_id, 'admin');

    -- Return the created channel with member count
    RETURN QUERY
    SELECT 
      c.id,
      c.name,
      c.description,
      c.created_at,
      c.created_by,
      COUNT(cm.user_id)::BIGINT AS members_count
    FROM 
      channels c
      LEFT JOIN channel_memberships cm ON c.id = cm.channel_id
    WHERE 
      c.id = v_channel_id
    GROUP BY 
      c.id;

  -- If any error occurs, it will be caught and the transaction will be rolled back
  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$$;

