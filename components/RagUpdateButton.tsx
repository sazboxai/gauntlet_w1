import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

interface RagUpdateButtonProps {
  channelId: string
}

export function RagUpdateButton({ channelId }: RagUpdateButtonProps) {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchRagStatus()
  }, [channelId])

  const fetchRagStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('rag_update')
        .select('updated_at')
        .eq('index_id', channelId)
        .eq('type', 'channel')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching RAG status:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch RAG status. Please try again.',
          variant: 'destructive',
        })
      }

      setLastUpdated(data?.updated_at || null)
    } catch (error) {
      console.error('Unexpected error fetching RAG status:', error)
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/update-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index_id: channelId,
          type: 'channel',
        }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()

      if (data.resp === 'ok') {
        toast({
          title: 'RAG Update Successful',
          description: 'The AI knowledge base has been updated.',
        })
        fetchRagStatus() // Refresh the status
      } else {
        throw new Error('Unexpected response from server')
      }
    } catch (error) {
      console.error('Error updating RAG:', error)
      toast({
        title: 'RAG Update Failed',
        description: 'There was an error updating the AI knowledge base. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button
      onClick={handleUpdate}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      ) : lastUpdated ? (
        `Last updated: ${new Date(lastUpdated).toLocaleString()}`
      ) : (
        'No updates yet'
      )}
    </Button>
  )
}

