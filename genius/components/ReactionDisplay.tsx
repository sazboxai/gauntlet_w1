import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Reaction {
  emoji: string
  count: number
  users: { id: string; username: string }[]
}

interface ReactionDisplayProps {
  reactions: Reaction[]
  onReact: (emoji: string) => void
  currentUserId: string
}

export function ReactionDisplay({ reactions, onReact, currentUserId }: ReactionDisplayProps) {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reactions.map((reaction) => (
        <ReactionGroup
          key={reaction.emoji}
          reaction={reaction}
          onReact={onReact}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}

interface ReactionGroupProps {
  reaction: Reaction
  onReact: (emoji: string) => void
  currentUserId: string
}

function ReactionGroup({ reaction, onReact, currentUserId }: ReactionGroupProps) {
  const [showUserList, setShowUserList] = useState(false)
  const hasReacted = reaction.users.some(user => user.id === currentUserId)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={hasReacted ? "secondary" : "outline"}
            size="sm"
            className="px-2 py-1 h-auto text-xs"
            onClick={() => onReact(reaction.emoji)}
          >
            {reaction.emoji} {reaction.count}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            {reaction.users.map(user => user.username).join(', ')}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

