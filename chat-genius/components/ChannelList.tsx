'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { getChannels, createChannel } from '@/lib/supabase'
import { Hash, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface Channel {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by: string
  membersCount: number
}

interface ChannelListProps {
  onChannelSelect: (channelId: string) => void
  selectedChannelId?: string
}

export function ChannelList({ onChannelSelect, selectedChannelId }: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { user } = useAuth()

  const fetchChannels = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getChannels()
      
      if (response.error) {
        throw response.error
      }

      if (Array.isArray(response.data)) {
        setChannels(response.data)
      } else {
        throw new Error('Invalid channel data format received')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load channels'
      setError(errorMessage)
      toast({
        title: "Error loading channels",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  if (isLoading) {
    return (
      <div className="w-64 bg-white border-r p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Channels</h2>
          <Button size="sm" variant="ghost" disabled>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Channels</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CreateChannelForm onSuccess={() => {
                setIsCreateDialogOpen(false)
                fetchChannels()
              }} />
            </DialogContent>
          </Dialog>
        </div>
        {error ? (
          <div className="text-red-500 text-sm mb-4">
            {error}
            <Button
              variant="link"
              className="pl-2 h-auto p-0 text-sm"
              onClick={fetchChannels}
            >
              Retry
            </Button>
          </div>
        ) : null}
        <div className="space-y-1">
          {channels.length === 0 ? (
            <p className="text-gray-500 text-sm">No channels available</p>
          ) : (
            channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                  selectedChannelId === channel.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="truncate">{channel.name}</span>
                <span className="ml-auto text-xs text-gray-400">{channel.membersCount}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function CreateChannelForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error } = await createChannel(name, description)
      if (error) throw error
      
      toast({
        title: "Channel created",
        description: `Channel "${name}" has been created successfully.`,
      })
      onSuccess()
      setName('')
      setDescription('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create channel'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create Channel</DialogTitle>
        <DialogDescription>
          Create a new channel for your team to collaborate in.
        </DialogDescription>
      </DialogHeader>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Channel Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. team-updates"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of this channel"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Channel'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default ChannelList

