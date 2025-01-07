'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Channel {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
}

export function ChannelList() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChannels()
  }, [])

  async function fetchChannels() {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      setChannels(data || [])
    } catch (err) {
      console.error('Error fetching channels:', err)
      setError('Failed to fetch channels. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="w-64 bg-gray-100 p-4">Loading channels...</div>
  }

  if (error) {
    return (
      <div className="w-64 bg-gray-100 p-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchChannels}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 bg-gray-100 p-4">
      <h2 className="text-xl font-bold mb-4">Channels</h2>
      {channels.length === 0 ? (
        <p>No channels available.</p>
      ) : (
        <ul>
          {channels.map((channel) => (
            <li key={channel.id} className="mb-2">
              {channel.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

