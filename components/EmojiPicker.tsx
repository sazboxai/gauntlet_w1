import React from 'react'
import { Button } from '@/components/ui/button'

const DEFAULT_EMOJIS = [
  '👍', '❤️', '😂', '🙌', '🎉',
  '🤔', '👀', '🔥', '💯', '✨',
  '🤝', '👎', '⭐', '🚀', '💪'
]

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <div className="bg-white border rounded-lg shadow-lg p-2">
      <div className="grid grid-cols-5 gap-2">
        {DEFAULT_EMOJIS.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            className="w-8 h-8 p-0"
            onClick={() => onEmojiSelect(emoji)}
          >
            {emoji}
          </Button>
        ))}
      </div>
    </div>
  )
}

