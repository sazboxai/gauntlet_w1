'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
import { getDirectMessages, sendDirectMessage, markMessageAsRead, setTypingStatus, getUserById } from '@/lib/supabase'
import { User, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
  read_at: string | null
}

interface DirectMessageChatProps {
  recipientId: string
}

export function DirectMessageChat({ recipientId }: DirectMessageChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] =useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [recipient, setRecipient] = useState<{ username: string; status: string; last_seen: string } | null>(null)
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel('direct-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages',
          filter: `sender_id=eq.${user?.id},receiver_id=eq.${recipientId}`
        }, 
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prevMessages) => [...prevMessages, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, recipientId])

  async function fetchMessages() {
    if (user) {
      const { data, error } = await getDirectMessages(user.id, recipientId)
      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data || [])
      }
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user && newMessage.trim()) {
      const { error } = await sendDirectMessage(user.id, recipientId, newMessage.trim())
      if (error) {
        console.error('Error sending message:', error)
      } else {
        setNewMessage('')
        fetchMessages()
      }
    }
  }

  const handleTyping = () => {
    if (user) {
      setTypingStatus(user.id, recipientId)
    }
  }

  useEffect(() => {
    async function fetchRecipient() {
      const { data, error } = await getUserById(recipientId)
      if (!error && data) {
        setRecipient(data)
      }
    }
    fetchRecipient()
  }, [recipientId])

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b p-4 flex items-center">
        <User className="w-8 h-8 text-gray-500 mr-2" />
        <div>
          <div className="font-medium">{recipient?.username || 'Loading...'}</div>
          <div className="text-xs text-gray-500">
            {recipient?.status === 'online' 
              ? 'Online'
              : recipient?.last_seen 
                ? `Last seen ${new Date(recipient.last_seen).toLocaleString()}`
                : 'Loading...'}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.sender_id === user?.id ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.sender_id === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {message.content}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(message.created_at).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {isTyping && (
        <div className="text-sm text-gray-500 p-2">Recipient is typing...</div>
      )}
      <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleTyping}
            placeholder="Type a message..."
            className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

