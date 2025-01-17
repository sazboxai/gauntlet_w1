'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function Navbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          ChatGenius
        </Link>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {user.user_metadata?.username || user.email}
              </span>
              <Button 
                onClick={handleSignOut} 
                variant="destructive"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/" className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded">
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

