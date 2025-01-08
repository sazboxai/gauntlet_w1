import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

interface ThreadComposerProps {
  onSendReply: (content: string) => void
}

export function ThreadComposer({ onSendReply }: ThreadComposerProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSendReply(content)
      setContent('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Reply to thread..."
        className="mb-2"
      />
      <Button type="submit" disabled={!content.trim()}>
        <Send className="w-4 h-4 mr-2" />
        Send Reply
      </Button>
    </form>
  )
}

