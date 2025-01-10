import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://llvypggvdkjmujkmysos.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdnlwZ2d2ZGtqbXVqa215c29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNTY0NTYsImV4cCI6MjA1MTgzMjQ1Nn0.1Z2cuVfDC7-qdZZtzVerMt5teae6QCwJED-rLSO6go4'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    return { data: null, error }
  }
}

export const getChannelMessages = async (channelId: string) => {
  try {
    const { data, error } = await supabase
      .from('channel_messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        channel_id,
        has_attachments,
        sender:users(id, username, avatar_url),
        files:files(
          id,
          filename,
          file_size,
          mime_type,
          storage_path
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching channel messages:', error)
    return { data: null, error }
  }
}

export const signUp = async (email: string, password: string, username: string) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (authError) throw authError

    if (authData.user) {
      // Manually insert the user into the public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: username,
          // Remove the email field from here
        })
        .select()
        .single()

      if (userError) throw userError

      return { data: { ...authData, profile: userData }, error: null }
    } else {
      throw new Error('User data not available after sign up')
    }
  } catch (error) {
    console.error('Error signing up:', error)
    return { data: null, error }
  }
}

export const getUsers = async (page = 1, limit = 20) => {
  try {
    const start = (page - 1) * limit
    const end = start + limit - 1

    const { data, error, count } = await supabase
      .from('users')
      .select('id, username, status, last_seen', { count: 'exact' })
      .range(start, end)
      .order('username', { ascending: true })

    if (error) {
      console.error('Error fetching users:', error)
      throw error
    }

    return { data: data || [], error: null, count }
  } catch (error) {
    console.error('Error in getUsers:', error)
    return { data: [], error, count: 0 }
  }
}

export const getChannels = async () => {
  try {
    const { data, error, count } = await supabase
      .from('channels')
      .select(`
        id,
        name,
        description,
        created_at,
        created_by,
        channel_memberships (
          count
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching channels:', error)
      throw error
    }

    const channelsWithMemberCount = data?.map(channel => ({
      ...channel,
      membersCount: channel.channel_memberships?.[0]?.count || 0
    })) || []

    return { data: channelsWithMemberCount, error: null, count }
  } catch (error) {
    console.error('Error in getChannels:', error)
    return { data: [], error, count: 0 }
  }
}

export const createChannel = async (name: string, description: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('channels')
      .insert({
        name,
        description,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    const { error: membershipError } = await supabase
      .from('channel_memberships')
      .insert({
        channel_id: data.id,
        user_id: user.id,
        role: 'admin'
      })

    if (membershipError) throw membershipError

    return { data, error: null }
  } catch (error) {
    console.error('Error creating channel:', error)
    return { data: null, error }
  }
}

export const sendChannelMessage = async (channelId: string, content: string, fileIds: string[] = []) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')

    // Fetch the user's data from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (userError) throw userError
    if (!userData) throw new Error('User not found in the users table')

    if (!content.trim() && fileIds.length > 0) {
      content = "File uploaded"
    }

    const { data, error } = await supabase
      .from('channel_messages')
      .insert({
        channel_id: channelId,
        sender_id: userData.id,
        content,
        has_attachments: fileIds.length > 0
      })
      .select()
      .single()

    if (error) throw error

    if (fileIds.length > 0) {
      const { error: fileUpdateError } = await supabase
        .from('files')
        .update({ message_id: data.id })
        .in('id', fileIds)
      
      if (fileUpdateError) throw fileUpdateError
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error sending channel message:', error)
    return { data: null, error }
  }
}

export const getChannelMembers = async (channelId: string) => {
  try {
    const { data, error } = await supabase
      .from('channel_memberships')
      .select(`
        user_id,
        role,
        users (
          username,
          avatar_url
        )
      `)
      .eq('channel_id', channelId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching channel members:', error)
    return { data: null, error }
  }
}

export const uploadFile = async (file: File, context: { type: 'channel' | 'direct', id: string }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `${context.type}/${context.id}/${fileName}`

    const { data: storageData, error: storageError } = await supabase.storage
      .from('public')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (storageError) throw storageError

    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .insert({
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: filePath,
        user_id: user.id,
        metadata: {}
      })
      .select()
      .single()

    if (fileError) throw fileError

    return { data: fileData, error: null }
  } catch (error) {
    console.error('Error uploading file:', error)
    return { data: null, error }
  }
}

export const searchFiles = async (
  query: string,
  channelId: string,
  fileType?: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    let supabaseQuery = supabase
      .from('files')
      .select('*')
      .eq('channel_id', channelId)
      .ilike('filename', `%${query}%`)

    if (fileType) {
      supabaseQuery = supabaseQuery.ilike('mime_type', `%${fileType}%`)
    }

    if (startDate) {
      supabaseQuery = supabaseQuery.gte('created_at', startDate)
    }

    if (endDate) {
      supabaseQuery = supabaseQuery.lte('created_at', endDate)
    }

    const { data, error } = await supabaseQuery

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error searching files:', error)
    return { data: null, error }
  }
}

export const deleteFile = async (fileId: string) => {
  try {
    const { data, error } = await supabase
      .from('files')
      .update({ is_deleted: true })
      .eq('id', fileId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error deleting file:', error)
    return { data: null, error }
  }
}

export const getDirectMessages = async (userId: string, recipientId: string) => {
  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        has_attachments,
        thread_id,
        reply_count,
        last_reply_at,
        sender:users!sender_id(username, avatar_url),
        receiver:users!receiver_id(username, avatar_url),
        attachments:direct_message_attachments(
          id,
          files:files(id, filename, file_size, mime_type, storage_path)
        )
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching direct messages:', error)
    return { data: null, error }
  }
}

export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, status, last_seen')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user:', error)
    return { data: null, error }
  }
}

export const sendDirectMessage = async (senderId: string, recipientId: string, content: string, fileIds: string[] = []) => {
  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: senderId,
        receiver_id: recipientId,
        content: content,
        has_attachments: fileIds.length > 0
      })
      .select()
      .single()

    if (error) throw error

    if (fileIds.length > 0) {
      const { error: attachmentError } = await supabase
        .from('direct_message_attachments')
        .insert(fileIds.map(fileId => ({
          message_id: data.id,
          file_id: fileId
        })))

      if (attachmentError) throw attachmentError
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error sending direct message:', error)
    return { data: null, error }
  }
}

export const setTypingStatus = async (userId: string, recipientId: string) => {
  try {
    const { data, error } = await supabase
      .from('typing_status')
      .upsert(
        { user_id: userId, recipient_id: recipientId, started_at: new Date().toISOString() },
        { onConflict: 'user_id,recipient_id' }
      )
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error setting typing status:', error)
    return { data: null, error }
  }
}

export const setChannelTypingStatus = async (userId: string, channelId: string) => {
  try {
    const { data, error } = await supabase
      .from('channel_typing_status')
      .upsert(
        { user_id: userId, channel_id: channelId, started_at: new Date().toISOString() },
        { onConflict: 'user_id,channel_id' }
      )
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error setting channel typing status:', error)
    return { data: null, error }
  }
}

export const createThreadReply = async (parentMessageId: string, content: string, userId: string, fileIds: string[] = []) => {
  try {
    console.log('Creating thread reply:', { parentMessageId, content, userId, fileIds })

    const channelId = await getChannelIdFromMessage(parentMessageId)
    console.log('Channel ID:', channelId)

    // Call the create_thread_reply function
    const { data, error } = await supabase.rpc('create_thread_reply', {
      p_parent_message_id: parentMessageId,
      p_content: content,
      p_sender_id: userId,
      p_channel_id: channelId,
      p_has_attachments: fileIds.length > 0
    })

    if (error) {
      console.error('Error in create_thread_reply RPC:', error)
      throw error
    }

    console.log('Thread reply inserted:', data)

    if (fileIds.length > 0 && data && data[0]) {
      const { error: fileUpdateError } = await supabase
        .from('files')
        .update({ message_id: data[0].id })
        .in('id', fileIds)
      
      if (fileUpdateError) {
        console.error('Error updating files:', fileUpdateError)
        throw fileUpdateError
      }
    }

    return { data: data && data[0], error: null }
  } catch (error) {
    console.error('Error in createThreadReply:', error)
    return { data: null, error }
  }
}

async function getChannelIdFromMessage(messageId: string) {
  const { data, error } = await supabase
    .from('channel_messages')
    .select('channel_id')
    .eq('id', messageId)
    .single()

  if (error) throw error
  return data.channel_id
}

export const getThreadMessages = async (parentMessageId: string) => {
  try {
    const { data, error } = await supabase
      .from('channel_messages')
      .select(`
        id,
        content,
        created_at,
        sender:users(id, username, avatar_url),
        files(id, filename, file_size, mime_type, storage_path)
      `)
      .eq('parent_message_id', parentMessageId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching thread messages:', error)
    return { data: null, error }
  }
}

export const getThreadParticipants = async (parentMessageId: string) => {
  try {
    const { data, error } = await supabase
      .from('thread_participants')
      .select(`
        user_id,
        users(id, username, avatar_url)
      `)
      .eq('message_id', parentMessageId)

    if (error) throw error
    return { data: data?.map(p => p.users), error: null }
  } catch (error) {
    console.error('Error fetching thread participants:', error)
    return { data: null, error }
  }
}

export const markThreadAsRead = async (parentMessageId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('thread_participants')
      .upsert(
        {
          message_id: parentMessageId,
          user_id: userId,
          last_read_at: new Date().toISOString()
        },
        { onConflict: ['message_id', 'user_id'] }
      )

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error marking thread as read:', error)
    return { error }
  }
}

export const getThreadStats = async (parentMessageId: string) => {
  try {
    const { data, error } = await supabase
      .from('channel_messages')
      .select('reply_count, last_reply_at')
      .eq('id', parentMessageId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching thread stats:', error)
    return { data: null, error }
  }
}

export const addReaction = async (messageId: string, userId: string, emoji: string) => {
  try {
    const { data, error } = await supabase
      .from('message_reactions')
      .insert({ message_id: messageId, user_id: userId, emoji })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding reaction:', error)
    return { data: null, error }
  }
}

export const removeReaction = async (messageId: string, userId: string, emoji: string) => {
  try {
    const { data, error } = await supabase
      .from('message_reactions')
      .delete()
      .match({ message_id: messageId, user_id: userId, emoji })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error removing reaction:', error)
    return { data: null, error }
  }
}

export const getReactions = async (messageId: string) => {
  try {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('emoji, user_id, users(username)')
      .eq('message_id', messageId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return { data: null, error }
  }
}

export const getReactionUsers = async (messageId: string, emoji: string) => {
  try {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('users(id, username, avatar_url)')
      .eq('message_id', messageId)
      .eq('emoji', emoji)

    if (error) throw error
    return { data: data?.map(item => item.users), error: null }
  } catch (error) {
    console.error('Error fetching reaction users:', error)
    return { data: null, error }
  }
}

export const addDirectMessageReaction = async (messageId: string, userId: string, emoji: string) => {
  try {
    const { data, error } = await supabase
      .from('direct_message_reactions')
      .insert({ message_id: messageId, user_id: userId, emoji })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding direct message reaction:', error)
    return { data: null, error }
  }
}

export const removeDirectMessageReaction = async (messageId: string, userId: string, emoji: string) => {
  try {
    const { data, error } = await supabase
      .from('direct_message_reactions')
      .delete()
      .match({ message_id: messageId, user_id: userId, emoji })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error removing direct message reaction:', error)
    return { data: null, error }
  }
}

export const getDirectMessageReactions = async (messageId: string) => {
  try {
    const { data, error } = await supabase
      .from('direct_message_reactions')
      .select('emoji, user_id, users(username)')
      .eq('message_id', messageId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching direct message reactions:', error)
    return { data: null, error }
  }
}

export const createDirectMessageThreadReply = async (parentMessageId: string, senderId: string, recipientId: string, content: string, fileIds: string[] = []) => {
  try {
    console.log('Creating direct message thread reply:', { parentMessageId, senderId, recipientId, content, fileIds })

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: senderId,
        receiver_id: recipientId,
        content: content,
        thread_id: parentMessageId,
        has_attachments: fileIds.length > 0
      })
      .select('*, sender:users!sender_id(*), receiver:users!receiver_id(*)')
      .single()

    if (error) {
      console.error('Error in createDirectMessageThreadReply:', error)
      throw error
    }

    if (!data) {
      throw new Error('No data returned from insert operation')
    }

    console.log('Direct message thread reply created:', data)

    if (fileIds.length > 0) {
      const { error: attachmentError } = await supabase
        .from('direct_message_attachments')
        .insert(fileIds.map(fileId => ({
          message_id: data.id,
          file_id: fileId
        })))

      if (attachmentError) {
        console.error('Error creating attachments:', attachmentError)
        throw attachmentError
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in createDirectMessageThreadReply:', error)
    return { data: null, error }
  }
}

export const getDirectMessageById = async (messageId: string) => {
  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        has_attachments,
        thread_id,
        reply_count,
        last_reply_at,
        sender:users!sender_id(username, avatar_url),
        receiver:users!receiver_id(username, avatar_url),
        attachments:direct_message_attachments(
          id,
          file_id,
          files:files(id, filename, file_size, mime_type, storage_path)
        )
      `)
      .eq('id', messageId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching direct message by ID:', error)
    return { data: null, error }
  }
}

export const getDirectMessageThreadReplies = async (parentMessageId: string) => {
  try {
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        has_attachments,
        sender:users!sender_id(username, avatar_url),
        receiver:users!receiver_id(username, avatar_url),
        attachments:direct_message_attachments(
          id,
          file_id,
          files:files(id, filename, file_size, mime_type, storage_path)
        )
      `)
      .eq('thread_id', parentMessageId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching direct message thread replies:', error)
    return { data: null, error }
  }
}

