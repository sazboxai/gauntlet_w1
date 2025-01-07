import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://llvypggvdkjmujkmysos.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdnlwZ2d2ZGtqbXVqa215c29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNTY0NTYsImV4cCI6MjA1MTgzMjQ1Nn0.1Z2cuVfDC7-qdZZtzVerMt5teae6QCwJED-rLSO6go4'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const signUp = async (email: string, password: string, username: string) => {
  try {
    // First, check if username is already taken
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      return { error: new Error('Username already taken') }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('User creation failed')
    }

    // Manually create the user profile in the public.users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username,
        status: 'online',
        last_seen: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      throw profileError
    }

    return { data: authData, error: null }
  } catch (error) {
    console.error('Error in signUp:', error)
    return { data: null, error }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('Sign in failed')
    }

    // Update user status to online
    const { error: statusError } = await supabase
      .from('users')
      .update({ 
        status: 'online',
        last_seen: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    if (statusError) {
      console.error('Error updating user status:', statusError)
    }

    return { data: authData, error: null }
  } catch (error) {
    console.error('Error in signIn:', error)
    return { data: null, error }
  }
}

export const signOut = async (userId: string) => {
  try {
    // Update user status to offline before signing out
    if (userId) {
      const { error: statusError } = await supabase
        .from('users')
        .update({ 
          status: 'offline',
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)

      if (statusError) {
        console.error('Error updating user status:', statusError)
      }
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error in signOut:', error)
    return { error }
  }
}

export const getUsers = async (page = 1, limit = 20) => {
  try {
    const start = (page - 1) * limit
    const end = start + limit - 1

    const { data, error, count } = await supabase
      .from('users')
      .select('id, username, status, last_seen', { count: 'exact' })
      .order('username')
      .range(start, end)

    if (error) {
      throw error
    }

    console.log('Fetched users:', data) // Debug log

    return { 
      data: data || [], 
      error: null, 
      count 
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { 
      data: [], 
      error, 
      count: 0 
    }
  }
}

export const getUserStatus = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('status, last_seen')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateUserStatus = async (userId: string, status: 'online' | 'offline') => {
  const { data, error } = await supabase
    .from('users')
    .update({ status, last_seen: new Date().toISOString() })
    .eq('id', userId)
  return { data, error }
}

export const getDirectMessages = async (userId: string, recipientId: string) => {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
  return { data, error }
}

export const sendDirectMessage = async (senderId: string, receiverId: string, content: string) => {
  const { data, error } = await supabase
    .from('direct_messages')
    .insert([
      { sender_id: senderId, receiver_id: receiverId, content }
    ])
  
  if (error) {
    console.error('Error sending message:', error)
  } else {
    console.log('Message sent successfully:', data)
  }
  
  return { data, error }
}

export const markMessageAsRead = async (messageId: string) => {
  const { data, error } = await supabase
    .from('direct_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId)
  return { data, error }
}

export const setTypingStatus = async (userId: string, recipientId: string) => {
  const { data, error } = await supabase
    .from('typing_status')
    .upsert({ user_id: userId, recipient_id: recipientId, started_at: new Date().toISOString() })
  return { data, error }
}

export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('username, status, last_seen')
    .eq('id', userId)
    .single()
  return { data, error }
}

