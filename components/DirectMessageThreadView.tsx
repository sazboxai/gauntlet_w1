import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { getDirectMessageThreadReplies, createDirectMessageThreadReply, getDirectMessageById } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { FileUploadZone } from './FileUploadZone'
import { FileMessage } from './FileMessage'

interface DirectMessageThreadViewProps {
  parentMessageId: string
  onClose: () => void
}

export function DirectMessageThreadView({ parentMessageId, onClose }: DirectMessageThreadViewProps) {
  const [replies, setReplies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    fetchReplies()
  }, [parentMessageId])

  const fetchReplies = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getDirectMessageThreadReplies(parentMessageId)
      if (error) {
        console.error('Error fetching thread replies:', error)
        throw error
      }
      if (!data || data.length === 0) {
        console.warn('No replies found for thread:', parentMessageId)
        // Fetch the original message if no replies are found
        const { data: originalMessage, error: originalMessageError } = await getDirectMessageById(parentMessageId)
        if (originalMessageError) {
          console.error('Error fetching original message:', originalMessageError)
          throw originalMessageError
        }
        setReplies([originalMessage])
      } else {
        setReplies(data)
      }
    } catch (error) {
      console.error('Error in fetchReplies:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load thread replies. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!user || (!replyContent.trim() && uploadedFiles.length === 0)) return

    try {
      const recipientId = replies.length > 0 ? 
        (replies[0].sender_id === user.id ? replies[0].receiver_id : replies[0].sender_id) : 
        null

      if (!recipientId) {
        throw new Error('Unable to determine recipient ID')
      }

      console.log('Sending reply:', { parentMessageId, senderId: user.id, recipientId, content: replyContent, fileIds: uploadedFiles })

      const { data, error } = await createDirectMessageThreadReply(
        parentMessageId,
        user.id,
        recipientId,
        replyContent,
        uploadedFiles
      )
      
      if (error) {
        console.error('Error details from createDirectMessageThreadReply:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from createDirectMessageThreadReply')
      }

      console.log('Reply sent successfully:', data)

      setReplies((prevReplies) => [...prevReplies, data])
      setReplyContent('')
      setUploadedFiles([])
    } catch (error) {
      console.error('Error in handleSendReply:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send reply. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (files: File[]) => {
    // Implement file upload logic here
    // For now, we'll just add the file names to the uploadedFiles state
    setUploadedFiles((prevFiles) => [...prevFiles, ...files.map(f => f.name)])
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Thread</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p>Loading thread replies...</p>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="flex items-start space-x-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={reply.sender?.avatar_url} alt={reply.sender?.username || 'Unknown User'} />
                <AvatarFallback>{(reply.sender?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold">{reply.sender?.username || 'Unknown User'}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1">{reply.content}</p>
                {reply.attachments && reply.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {reply.attachments.map((file: any) => (
                      <FileMessage
                        key={file.id}
                        file={file}
                        isOwner={reply.sender_id === user?.id}
                        onDelete={() => {}} // Implement file deletion if needed
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t">
        <FileUploadZone onFileSelect={handleFileSelect} />
        <Textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Reply to thread..."
          className="mb-2"
        />
        <Button onClick={handleSendReply} disabled={!replyContent.trim() && uploadedFiles.length === 0}>
          Send Reply
        </Button>
      </div>
    </div>
  )
}

