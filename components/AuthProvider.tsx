'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        updateUserStatus(session.user.id, 'online')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
        } else {
          setUser({ ...session.user, ...userData })
        }

        if (event === 'SIGNED_IN') {
          await updateUserStatus(session.user.id, 'online')
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (user) {
      try {
        await updateUserStatus(user.id, 'offline')
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setUser(null)
        router.push('/')
      } catch (error) {
        console.error('Error signing out:', error)
        throw error
      }
    }
  }

  const updateUserStatus = async (userId: string, status: 'online' | 'offline') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

