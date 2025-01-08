import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { getChannelMessages, sendChannelMessage, supabase } from '@/lib/supabase'
import { MessageItem } from './MessageItem'
import { MessageComposer } from './MessageComposer'
import { ThreadView } from './ThreadView'
import { toast } from "@/components/ui/use-toast"
import { SearchBar } from './SearchBar'
import { FileSearchModal } from './FileSearchModal'

interface ChannelChatProps {
  channelId: string
}

export default function ChannelChat({ channelId }: ChannelChatProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const { user } = useAuth()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel(`channel-${channelId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'channel_messages',
          filter: `channel_id=eq.${channelId}`
        }, 
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getChannelMessages(channelId)
      if (error) throw error
      setMessages(data || [])
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
      const { data, error } = await sendChannelMessage(channelId, content, fileIds)
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearchModalOpen(true)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b p-4">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p>Loading messages...</p>
          ) : (
            messages.map((message) => (
              <MessageItem 
                key={message.id} 
                message={message} 
                onThreadClick={() => setActiveThreadId(message.id)}
              />
            ))
          )}
        </div>
        <MessageComposer onSendMessage={handleSendMessage} channelId={channelId} />
      </div>
      {activeThreadId && (
        <div className="w-96 border-l">
          <ThreadView 
            parentMessageId={activeThreadId} 
            onClose={() => setActiveThreadId(null)} 
          />
        </div>
      )}
      <FileSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        channelId={channelId}
        initialQuery={searchQuery}
      />
    </div>
  )
}

