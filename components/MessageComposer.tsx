import React, { useState } from 'react'
import { Send, Paperclip, Bot, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileUploadZone } from '@/components/FileUploadZone'
import { uploadFile, sendChannelMessage } from '@/lib/supabase'
import { toast } from "@/components/ui/use-toast"
import { useAuth } from './AuthProvider'

interface MessageComposerProps {
  onSendMessage: (content: string, fileIds: string[]) => Promise<any>
  channelId: string
}

export function MessageComposer({ onSendMessage, channelId }: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [showUploadZone, setShowUploadZone] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() || uploadedFiles.length > 0) {
      try {
        await onSendMessage(message.trim(), uploadedFiles)
        setMessage('')
        setUploadedFiles([])
        setShowUploadZone(false)
      } catch (error) {
        console.error('Error sending message:', error)
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAIResponse = async () => {
    if (!message.trim() || !user) return

    setIsGeneratingAI(true)
    try {
      // First, send the user's message
      const userMessage = await onSendMessage(message.trim(), uploadedFiles)

      const response = await fetch('/api/ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          message: message.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI response')
      }

      const data = await response.json()
      
      if (data.answer && data.resp) {
        // Send the AI response
        await sendChannelMessage(channelId, data.resp, [], 'ai_agent')
      } else {
        throw new Error('Invalid AI response format')
      }

      // Clear the input
      setMessage('')
      setUploadedFiles([])
      setShowUploadZone(false)
    } catch (error) {
      console.error('Error generating AI response:', error)
      toast({
        title: "AI Response Failed",
        description: "Failed to generate AI response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleFileSelect = async (files: File[]) => {
    setIsUploading(true)
    try {
      const uploadedFileIds = await Promise.all(
        files.map(async (file) => {
          const { data, error } = await uploadFile(file, {
            type: 'channel',
            id: channelId
          })
          if (error) throw error
          return data.id
        })
      )
      setUploadedFiles((prev) => [...prev, ...uploadedFileIds])
    } catch (error) {
      console.error('Error uploading files:', error)
      toast({
        title: "Upload failed",
        description: "There was a problem uploading the files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
      {showUploadZone && (
        <FileUploadZone onFileSelect={handleFileSelect} />
      )}
      <div className="flex items-center space-x-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowUploadZone(!showUploadZone)}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button 
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleAIResponse}
          disabled={isGeneratingAI || !message.trim()}
        >
          {isGeneratingAI ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </Button>
        <Button 
          type="submit" 
          disabled={isUploading || isGeneratingAI || (!message.trim() && uploadedFiles.length === 0)}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}

