import React, { useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ThreadMessagesProps {
  messages: any[]
  isLoading: boolean
}

export function ThreadMessages({ messages, isLoading }: ThreadMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return <div className="flex-1 p-4">Loading thread messages...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <div key={message.id} className="flex items-start space-x-3 mb-4">
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.users.avatar_url} alt={message.users.username} />
            <AvatarFallback>{message.users.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold">{message.users.username}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1">{message.content}</p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

