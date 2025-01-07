'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'

export function Navbar() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut();
      // Optionally, you can add a redirect here
      // window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          ChatGenius
        </Link>
        <div>
          {user ? (
            <>
              <span className="mr-4">Welcome, {user.email}</span>
              <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
                Sign Out
              </button>
            </>
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

