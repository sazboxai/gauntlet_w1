import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { getThreadMessages, getThreadParticipants, createThreadReply, markThreadAsRead, supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { FileUploadZone } from './FileUploadZone'

interface ThreadViewProps {
  parentMessageId: string
  onClose: () => void
}

export function ThreadView({ parentMessageId, onClose }: ThreadViewProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    console.log('Current user:', user)
    fetchThreadData()
    const channel = supabase
      .channel(`thread-${parentMessageId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'channel_messages',
          filter: `parent_message_id=eq.${parentMessageId}`
        }, 
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [parentMessageId, user])

  const fetchThreadData = async () => {
    setIsLoading(true)
    try {
      const [messagesResponse, participantsResponse] = await Promise.all([
        getThreadMessages(parentMessageId),
        getThreadParticipants(parentMessageId)
      ])

      if (messagesResponse.error) throw messagesResponse.error
      if (participantsResponse.error) throw participantsResponse.error

      setMessages(messagesResponse.data || [])
      setParticipants(participantsResponse.data || [])

      if (user) {
        await markThreadAsRead(parentMessageId, user.id)
      }
    } catch (error) {
      console.error('Error fetching thread data:', error)
      toast({
        title: "Error",
        description: "Failed to load thread data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!user || (!replyContent.trim() && uploadedFiles.length === 0)) return

    try {
      const { data, error } = await createThreadReply(parentMessageId, replyContent, user.id, uploadedFiles)
      if (error) throw error

      if (data) {
        setMessages((prevMessages) => [...prevMessages, data])
        setReplyContent('')
        setUploadedFiles([])
      } else {
        throw new Error('No data returned from createThreadReply')
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      toast({
        title: "Error",
        description: `Failed to send reply: ${error.message || 'Unknown error'}`,
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
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Thread</h3>
          <div className="flex -space-x-2">
            {participants.slice(0, 3).map((participant) => (
              <Avatar key={participant.id} className="w-6 h-6 border-2 border-background">
                <AvatarImage src={participant.avatar_url} alt={participant.username} />
                <AvatarFallback>{participant.username ? participant.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
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
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p>Loading thread messages...</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={message.sender?.avatar_url} alt={message.sender?.username || 'Unknown User'} />
                <AvatarFallback>{message.sender?.username ? message.sender.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="font-semibold">{message.sender?.username || 'Unknown User'}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1">{message.content}</p>
                {message.files && message.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.files.map((file: any) => (
                      <FileMessage
                        key={file.id}
                        file={file}
                        isOwner={message.sender?.id === user?.id}
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

