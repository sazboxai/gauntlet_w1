import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileMessage } from '@/components/FileMessage'
import { searchFiles } from '@/lib/supabase'
import { File, Calendar, Filter } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { SearchBar } from '@/components/SearchBar'

interface FileSearchModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  initialQuery: string
}

export function FileSearchModal({ isOpen, onClose, channelId, initialQuery }: FileSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [fileType, setFileType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [files, setFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery)
      handleSearch()
    }
  }, [isOpen, initialQuery, channelId])

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await searchFiles(searchQuery, channelId, fileType, startDate, endDate)
      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error searching files:', error)
      toast({
        title: "Error",
        description: "Failed to search files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Search Files</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <SearchBar onSearch={(query) => {
            setSearchQuery(query)
            handleSearch()
          }} />
          <div className="flex items-center gap-4">
            <Input
              placeholder="File type"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="pl-8"
            />
            <File className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-8"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-8"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Apply Filters'}
          </Button>
        </div>
        <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-center text-gray-500">No files found</p>
          ) : (
            files.map((file) => (
              <FileMessage
                key={file.id}
                file={file}
                isOwner={false}
                onDelete={() => {}}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

