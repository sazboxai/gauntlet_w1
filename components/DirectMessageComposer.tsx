import React, { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileUploadZone } from '@/components/FileUploadZone'
import { uploadFile } from '@/lib/supabase'
import { toast } from "@/components/ui/use-toast"

interface DirectMessageComposerProps {
  onSendMessage: (content: string, fileIds: string[]) => void
  recipientId: string
}

export function DirectMessageComposer({ onSendMessage, recipientId }: DirectMessageComposerProps) {
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadZone, setShowUploadZone] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() || uploadedFiles.length > 0) {
      onSendMessage(message.trim(), uploadedFiles)
      setMessage('')
      setUploadedFiles([])
      setShowUploadZone(false)
    }
  }

  const handleFileSelect = async (files: File[]) => {
    setIsUploading(true)
    try {
      const uploadedFileIds = await Promise.all(
        files.map(async (file) => {
          const { data, error } = await uploadFile(file, {
            type: 'direct',
            id: recipientId
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
        <Button type="submit" disabled={isUploading || (!message.trim() && uploadedFiles.length === 0)}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}

