'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
import { getDirectMessages, sendDirectMessage, supabase } from '@/lib/supabase'
import { DirectMessageItem } from './DirectMessageItem'
import { DirectMessageComposer } from './DirectMessageComposer'
import { DirectMessageThreadView } from './DirectMessageThreadView'
import { toast } from "@/components/ui/use-toast"

interface DirectMessageChatProps {
  recipientId: string
}

export function DirectMessageChat({ recipientId }: DirectMessageChatProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel(`direct-messages-${recipientId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${user?.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user?.id}))`
        }, 
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, recipientId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      if (user) {
        const { data, error } = await getDirectMessages(user.id, recipientId)
        if (error) throw error
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (content: string, fileIds: string[]) => {
    if (!user) return

    try {
      const { data, error } = await sendDirectMessage(user.id, recipientId, content, fileIds)
      if (error) throw error
      setMessages((prevMessages) => [...prevMessages, data])
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p>Loading messages...</p>
          ) : (
            messages.map((message) => (
              <DirectMessageItem 
                key={message.id} 
                message={message} 
                onThreadClick={() => setActiveThreadId(message.id)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <DirectMessageComposer onSendMessage={handleSendMessage} recipientId={recipientId} />
      </div>
      {activeThreadId && (
        <div className="w-96 border-l">
          <DirectMessageThreadView 
            parentMessageId={activeThreadId} 
            onClose={() => setActiveThreadId(null)} 
          />
        </div>
      )}
    </div>
  )
}

