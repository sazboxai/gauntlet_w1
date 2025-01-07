'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

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
      console.log('Auth state changed:', event) // Debug log
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser && event === 'SIGNED_IN') {
        await updateUserStatus(currentUser.id, 'online')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    // Update user status based on visibility
    const handleVisibilityChange = () => {
      const status = document.hidden ? 'offline' : 'online'
      updateUserStatus(user.id, status)
    }

    // Update user status based on window focus
    const handleFocus = () => updateUserStatus(user.id, 'online')
    const handleBlur = () => updateUserStatus(user.id, 'offline')

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [user])

  const signOut = async () => {
    if (user) {
      try {
        await updateUserStatus(user.id, 'offline');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error('Error signing out:', error);
        throw error; // Rethrow the error so it can be caught in the Navbar component
      }
    }
    setUser(null);
  };

  const updateUserStatus = async (userId: string, status: 'online' | 'offline') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          status, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

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

