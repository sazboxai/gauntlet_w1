import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ThreadHeaderProps {
  participants: any[]
  onClose: () => void
}

export function ThreadHeader({ participants, onClose }: ThreadHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold">Thread</h3>
        <div className="flex -space-x-2">
          {participants.slice(0, 3).map((participant) => (
            <Avatar key={participant.user_id} className="w-6 h-6 border-2 border-background">
              <AvatarImage src={participant.users.avatar_url} alt={participant.users.username} />
              <AvatarFallback>{participant.users.username.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
          {participants.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
              +{participants.length - 3}
            </div>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

