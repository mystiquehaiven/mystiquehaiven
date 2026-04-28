'use client'
import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return unsubscribe
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className="fixed top-4 right-4 z-50">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex flex-col justify-center items-center w-10 h-10 gap-[5px] group"
        aria-label="Toggle menu"
      >
        <span className={`block w-6 h-px bg-[#e8e0d5]/60 transition-all duration-300 ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
        <span className={`block w-6 h-px bg-[#e8e0d5]/60 transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-6 h-px bg-[#e8e0d5]/60 transition-all duration-300 ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
      </button>

      {/* Dropdown panel */}
      <div className={`absolute right-0 mt-2 w-48 flex flex-col transition-all duration-300 origin-top-right
        bg-black/80 backdrop-blur-sm border border-[#e8e0d5]/10
        ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        {user ? (
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="py-3 px-5 text-xs tracking-[0.3em] text-[#e8e0d5]/60 uppercase hover:text-[#e8e0d5] transition-colors duration-300"
          >
            Profile
          </Link>
        ) : (
          <Link
            href="/signin"
            onClick={() => setOpen(false)}
            className="py-3 px-5 text-xs tracking-[0.3em] text-[#e8e0d5]/60 uppercase hover:text-[#e8e0d5] transition-colors duration-300"
          >
            Sign In
          </Link>
        )}

        {user && (
          <>
            <div className="mx-5 h-px bg-[#e8e0d5]/10" />
            <button
              onClick={async () => {
                await auth.signOut()
                setOpen(false)
                router.push('/signin')
              }}
              className="py-3 px-5 text-left text-xs tracking-[0.3em] text-[#e8e0d5]/20 uppercase hover:text-[#e8e0d5]/40 transition-colors duration-300"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  )
}