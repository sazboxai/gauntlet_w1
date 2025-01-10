import React, { useState } from 'react'
import { FileIcon, defaultStyles } from 'react-file-icon'
import { Download, Trash2, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FileMessageProps {
  file: {
    id: string
    filename: string
    file_size: number
    mime_type: string
    storage_path: string
  }
  isOwner: boolean
  onDelete: () => void
}

export function FileMessage({ file, isOwner, onDelete }: FileMessageProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileExtension = file.filename ? file.filename.split('.').pop()?.toLowerCase() || '' : ''

  const isPreviewable = (
    file.mime_type?.startsWith('image/') ||
    file.mime_type === 'application/pdf' ||
    ['mp4', 'webm'].includes(fileExtension)
  )

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('public')
        .createSignedUrl(file.storage_path, 60)

      if (error) throw error
      if (!data?.signedUrl) throw new Error('Could not generate download URL')

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a')
      link.href = data.signedUrl
      link.download = file.filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download started",
        description: `Downloading ${file.filename}...`,
      })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Download failed",
        description: "There was a problem downloading the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handlePreview = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('public')
        .createSignedUrl(file.storage_path, 3600)

      if (error) throw error
      if (!data?.signedUrl) throw new Error('Could not generate preview URL')
      
      setPreviewUrl(data.signedUrl)
      setShowPreview(true)
    } catch (error) {
      console.error('Error generating preview URL:', error)
      toast({
        title: "Preview failed",
        description: "There was a problem generating the preview. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    try {
      const { error: deleteStorageError } = await supabase.storage
        .from('public')
        .remove([file.storage_path])

      if (deleteStorageError) throw deleteStorageError

      const { error: deleteDbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id)

      if (deleteDbError) throw deleteDbError

      onDelete()
      toast({
        title: "File deleted",
        description: `${file.filename} has been deleted.`,
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderPreview = () => {
    if (!previewUrl) return null

    if (file.mime_type?.startsWith('image/')) {
      return (
        <img 
          src={previewUrl} 
          alt={file.filename}
          className="max-w-full max-h-[80vh] object-contain"
        />
      )
    }

    if (file.mime_type === 'application/pdf') {
      return (
        <iframe
          src={`${previewUrl}#view=FitH`}
          className="w-full h-[80vh]"
          title={file.filename}
        />
      )
    }

    if (['mp4', 'webm'].includes(fileExtension)) {
      return (
        <video
          src={previewUrl}
          controls
          className="max-w-full max-h-[80vh]"
        >
          Your browser does not support the video tag.
        </video>
      )
    }

    return null
  }

  return (
    <>
      <div className="flex items-center space-x-4 p-2 bg-gray-100 rounded-lg">
        <div className="w-10 h-10">
          <FileIcon
            extension={fileExtension}
            {...defaultStyles[fileExtension]}
          />
        </div>
        <div className="flex-grow">
          <p className="text-sm font-medium truncate">{file.filename || 'Unnamed file'}</p>
          <p className="text-xs text-gray-500">
            {(file.file_size / 1024).toFixed(2)} KB
          </p>
        </div>
        <div className="flex space-x-2">
          {isPreviewable && (
            <Button variant="ghost" size="sm" onClick={handlePreview}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{file.filename}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

