'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { getUsers } from '@/lib/supabase'
import { User, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserItemProps {
  user: {
    id: string
    username: string
    status: 'online' | 'offline'
    last_seen: string
  }
  onClick: () => void
}

function UserItem({ user, onClick }: UserItemProps) {
  return (
    <div
      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <User className="w-8 h-8 text-gray-500" />
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
            user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
          }`}
        />
      </div>
      <div className="ml-2">
        <div className="font-medium">{user.username}</div>
        <div className="text-xs text-gray-500">
          {user.status === 'online'
            ? 'Online'
            : `Last seen ${new Date(user.last_seen).toLocaleString()}`}
        </div>
      </div>
    </div>
  )
}

export function UsersList({ onUserSelect }: { onUserSelect: (userId: string) => void }) {
  const [users, setUsers] = useState<UserItemProps['user'][]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [page])

  async function fetchUsers() {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error, count } = await getUsers(page)
      
      if (error) throw error

      setUsers(prevUsers => {
        const newUsers = data.filter((u) => u.id !== user?.id)
        return page === 1 ? newUsers : [...prevUsers, ...newUsers]
      })
      setHasMore(count > page * 20)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const userPresenceSubscription = supabase
      .channel('user-presence')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === payload.new.id ? { ...u, ...payload.new } : u
            )
          )
        } else if (payload.eventType === 'INSERT') {
          if (payload.new.id !== user?.id) {
            setUsers(prevUsers => [...prevUsers, payload.new])
          }
        }
      })
      .subscribe()

    return () => {
      userPresenceSubscription.unsubscribe()
    }
  }, [user?.id])

  if (error) {
    return (
      <div className="w-64 bg-white border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => {
            setPage(1)
            fetchUsers()
          }}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r">
      <h2 className="text-lg font-semibold p-4">Users</h2>
      <div className="overflow-y-auto h-[calc(100vh-60px)]">
        {users.length === 0 && !isLoading ? (
          <div className="p-4 text-gray-500">No other users found</div>
        ) : (
          <>
            {users.map((user) => (
              <UserItem key={user.id} user={user} onClick={() => onUserSelect(user.id)} />
            ))}
            {hasMore && (
              <button
                className="w-full p-2 text-blue-500 hover:bg-gray-100 disabled:opacity-50"
                onClick={() => setPage(prevPage => prevPage + 1)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  'Load More'
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

