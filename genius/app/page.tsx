'use client'

import { useState } from 'react'
import { Login } from '@/components/Login'
import { Signup } from '@/components/Signup'
import { useAuth } from '@/components/AuthProvider'
import { UsersList } from '@/components/UsersList'
import { DirectMessageChat } from '@/components/DirectMessageChat'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { user } = useAuth()

  if (user) {
    return (
      <main className="flex h-screen">
        <UsersList onUserSelect={setSelectedUserId} />
        {selectedUserId ? (
          <DirectMessageChat recipientId={selectedUserId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-500">Select a user to start chatting</p>
          </div>
        )}
      </main>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 ${activeTab === 'login' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 ${activeTab === 'signup' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>
        {activeTab === 'login' ? <Login /> : <Signup />}
      </div>
    </div>
  )
}

