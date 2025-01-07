'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

export function MessageInput() {
  const [message, setMessage] = useState('')
  const { user } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || !user) return

    const { error } = await supabase
      .from('messages')
      .insert({ content: message, user_id: user.id })

    if (error) console.error('Error sending message:', error)
    else setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-100">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="w-full p-2 rounded border"
      />
    </form>
  )
}

