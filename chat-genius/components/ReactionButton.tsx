import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmojiPicker } from './EmojiPicker'
import { Smile } from 'lucide-react'

interface ReactionButtonProps {
  onReact: (emoji: string) => void
}

export function ReactionButton({ onReact }: ReactionButtonProps) {
  const [showPicker, setShowPicker] = useState(false)

  const handleEmojiSelect = (emoji: string) => {
    onReact(emoji)
    setShowPicker(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPicker(!showPicker)}
      >
        <Smile className="w-4 h-4 mr-1" />
        React
      </Button>
      {showPicker && (
        <div className="absolute bottom-full mb-2">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      )}
    </div>
  )
}

