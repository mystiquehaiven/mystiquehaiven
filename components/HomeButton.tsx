'use client'
import Link from 'next/link'
import Image from 'next/image'

export default function HomeButton() {

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* Hamburger button */}
      <button
        className="flex flex-col justify-center items-center w-10 h-10 gap-[5px] group"
        aria-label="Toggle menu"
      >
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={40}
          height={40}
          priority
        />
      </button>

      {/* Dropdown panel */}
      <div className={`absolute left-0 mt-2 w-48 flex flex-col transition-all duration-300 origin-top-left`}
      >

        <div className="mx-5 h-px bg-[#e8e0d5]/10" />
        <Link
          href="/"
        >
        </Link>

      </div>
    </div>
  )
}