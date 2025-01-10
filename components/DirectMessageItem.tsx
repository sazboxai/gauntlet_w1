import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare, Reply } from 'lucide-react'
import { FileMessage } from './FileMessage'
import { useAuth } from './AuthProvider'
import { ReactionButton } from './ReactionButton'
import { ReactionDisplay } from './ReactionDisplay'
import { addDirectMessageReaction, removeDirectMessageReaction, getDirectMessageReactions } from '@/lib/supabase'

interface DirectMessageItemProps {
  message: {
    id: string
    content: string
    created_at: string
    sender_id: string
    receiver_id: string
    sender?: {
      id: string
      username: string
      avatar_url?: string
    }
    receiver?: {
      id: string
      username: string
      avatar_url?: string
    }
    attachments?: Array<{
      id: string
      files: {
        id: string
        filename: string
        file_size: number
        mime_type: string
        storage_path: string
      }
    }>
    reply_count?: number
    last_reply_at?: string
  }
  onThreadClick: () => void
}

export function DirectMessageItem({ message, onThreadClick }: DirectMessageItemProps) {
  const { user } = useAuth()
  const [reactions, setReactions] = useState<any[]>([])

  React.useEffect(() => {
    fetchReactions()
  }, [message.id])

  const fetchReactions = async () => {
    const { data, error } = await getDirectMessageReactions(message.id)
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
      await removeDirectMessageReaction(message.id, user.id, emoji)
    } else {
      await addDirectMessageReaction(message.id, user.id, emoji)
    }

    fetchReactions()
  }

  const senderName = message.sender?.username || 'Unknown User'
  const senderAvatar = message.sender?.avatar_url || ''

  return (
    <div className="flex flex-col mb-4">
      <div className="flex items-start space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={senderAvatar} alt={senderName} />
          <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold">{senderName}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>
          <p className="mt-1">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <FileMessage
                  key={attachment.id}
                  file={attachment.files}
                  isOwner={message.sender_id === user?.id}
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
              onClick={onThreadClick}
              className="flex items-center space-x-1"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </Button>
            {message.reply_count && message.reply_count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onThreadClick}
                className="flex items-center space-x-1"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

