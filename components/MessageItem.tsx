import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare, Reply, Bot } from 'lucide-react'
import { FileMessage } from './FileMessage'
import { useAuth } from './AuthProvider'
import { ThreadView } from './ThreadView'
import { ReactionButton } from './ReactionButton'
import { ReactionDisplay } from './ReactionDisplay'
import { addReaction, removeReaction, getReactions } from '@/lib/supabase'

interface MessageItemProps {
  message: {
    id: string
    content: string
    created_at: string
    sender: {
      id: string
      username: string
      avatar_url?: string
    }
    files?: Array<{
      id: string
      filename: string
      file_size: number
      mime_type: string
      storage_path: string
    }>
    reply_count?: number
    last_reply_at?: string
    thread_participant_count?: number
    is_ai?: boolean
  }
}

export function MessageItem({ message }: MessageItemProps) {
  const { user } = useAuth()
  const [showThread, setShowThread] = useState(false)
  const [reactions, setReactions] = useState<any[]>([])

  useEffect(() => {
    fetchReactions()
  }, [message.id])

  const fetchReactions = async () => {
    const { data, error } = await getReactions(message.id)
    if (error) {
      console.error('Error fetching reactions:', error)
    } else {
      const groupedReactions = groupReactions(data || [])
      setReactions(groupedReactions)
    }
  }

  const groupReactions = (reactionData: any[]) => {
    const grouped = reactionData.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [] }
      }
      acc[reaction.emoji].count++
      acc[reaction.emoji].users.push({ id: reaction.user_id, username: reaction.users.username })
      return acc
    }, {})
    return Object.values(grouped)
  }

  const handleReact = async (emoji: string) => {
    if (!user) return

    const existingReaction = reactions.find(r => r.emoji === emoji && r.users.some((u: any) => u.id === user.id))

    if (existingReaction) {
      await removeReaction(message.id, user.id, emoji)
    } else {
      await addReaction(message.id, user.id, emoji)
    }

    fetchReactions()
  }

  const toggleThread = () => {
    setShowThread(!showThread)
  }

  const isAIMessage = message.sender?.username === 'ai_agent'

  return (
    <div className="flex flex-col mb-4">
      <div className={`flex items-start space-x-3 p-3 rounded-lg ${
        isAIMessage ? 'bg-blue-50' : ''
      }`}>
        <Avatar className="w-8 h-8">
          {isAIMessage ? (
            <Bot className="w-6 h-6 text-blue-500" />
          ) : (
            <>
              <AvatarImage src={message.sender?.avatar_url} alt={message.sender?.username || 'Unknown User'} />
              <AvatarFallback>{message.sender?.username ? message.sender.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-baseline space-x-2">
            <span className={`font-semibold ${isAIMessage ? 'text-blue-600' : ''}`}>
              {isAIMessage ? 'AI Assistant' : message.sender?.username || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>
          <p className="mt-1">{message.content}</p>
          {message.files && message.files.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.files.map((file) => (
                <FileMessage
                  key={file.id}
                  file={file}
                  isOwner={message.sender?.id === user?.id}
                  onDelete={() => {}} // Implement file deletion if needed
                />
              ))}
            </div>
          )}
          <ReactionDisplay
            reactions={reactions}
            onReact={handleReact}
            currentUserId={user?.id || ''}
          />
          <div className="mt-2 flex items-center space-x-2">
            <ReactionButton onReact={handleReact} />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleThread}
              className="flex items-center space-x-1"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </Button>
            {message.reply_count && message.reply_count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleThread}
                className="flex items-center space-x-1"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      {showThread && (
        <div className="ml-11 mt-2 border-l-2 border-gray-200 pl-4">
          <ThreadView parentMessageId={message.id} onClose={() => setShowThread(false)} />
        </div>
      )}
    </div>
  )
}

