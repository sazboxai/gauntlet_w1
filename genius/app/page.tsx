'use client'

import { useState } from 'react'
import { Login } from '@/components/Login'
import { Signup } from '@/components/Signup'
import { useAuth } from '@/components/AuthProvider'
import { UsersList } from '@/components/UsersList'
import { DirectMessageChat } from '@/components/DirectMessageChat'
import { ChannelList } from '@/components/ChannelList'
import ChannelChat from '@/components/ChannelChat'

type ChatView = {
  type: 'direct' | 'channel'
  id: string
} | null

export default function Home() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [selectedChat, setSelectedChat] = useState<ChatView>(null)
  const { user } = useAuth()

  if (user) {
    return (
      <main className="flex h-screen">
        <div className="flex">
          <ChannelList
            onChannelSelect={(channelId) => setSelectedChat({ type: 'channel', id: channelId })}
            selectedChannelId={selectedChat?.type === 'channel' ? selectedChat.id : undefined}
          />
          <UsersList
            onUserSelect={(userId) => setSelectedChat({ type: 'direct', id: userId })}
          />
        </div>
        {selectedChat ? (
          selectedChat.type === 'direct' ? (
            <DirectMessageChat recipientId={selectedChat.id} />
          ) : (
            <ChannelChat channelId={selectedChat.id} />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-500">Select a channel or user to start chatting</p>
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

