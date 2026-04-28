'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return unsubscribe
  }, [])

  return (
    <nav className="fixed top-0 w-full z-50 ...">
      {user ? (
        <Link href="/profile">
          <img src={user.photoURL ?? '/default-avatar.png'} alt="Profile" />
        </Link>
      ) : (
        <Link href="/signin">Sign In</Link>
      )}
              <button
          onClick={async () => { await auth.signOut(); router.push("/signin"); }}
          className="w-full py-3 text-xs tracking-[0.3em] text-[#e8e0d5]/20 uppercase hover:text-[#e8e0d5]/40 transition-colors duration-300"
        >
          Sign Out
        </button>
    </nav>
  )
}