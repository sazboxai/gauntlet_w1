'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
  };
}

export function MessageList() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMessages()
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleNewMessage)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchMessages() {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user:users (username)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setMessages(data?.reverse() || [])
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to fetch messages. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleNewMessage(payload: any) {
    setMessages((prevMessages) => [...prevMessages, payload.new])
  }

  if (isLoading) {
    return <div className="flex-1 overflow-y-auto p-4">Loading messages...</div>
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchMessages}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        messages.map((message) => (
          <div key={message.id} className="mb-4">
            <strong>{message.user.username}: </strong>
            {message.content}
          </div>
        ))
      )}
    </div>
  )
}

