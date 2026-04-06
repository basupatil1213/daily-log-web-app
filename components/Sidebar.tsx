'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: `/log/${today}`,
      label: 'Today',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/reports',
      label: 'Reports',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#09090B] border-b border-white/[0.07] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="font-display font-bold text-sm text-zinc-100">Chronicle</span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 z-40
          bg-[#09090B] border-r border-white/[0.07]
          flex flex-col
          transition-transform duration-200
          ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-mono">C</span>
            </div>
            <div>
              <div className="font-display font-bold text-sm text-zinc-100">Chronicle</div>
              <div className="font-mono text-[10px] text-zinc-600">daily log</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest px-3 py-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : item.href === '/reports'
                ? pathname.startsWith('/reports')
                : pathname.startsWith('/log')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                  ${isActive
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }
                `}
              >
                <span className={isActive ? 'text-violet-400' : ''}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          {/* Quick week links */}
          <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest px-3 py-2 mt-4">
            Recent Days
          </div>
          {Array.from({ length: 5 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = format(d, 'yyyy-MM-dd')
            const isToday = i === 0
            const isActive = pathname === `/log/${dateStr}`
            return (
              <Link
                key={dateStr}
                href={`/log/${dateStr}`}
                onClick={() => setMenuOpen(false)}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150
                  ${isActive
                    ? 'bg-white/[0.07] text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }
                `}
              >
                <span>{isToday ? 'Today' : format(d, 'EEE, MMM d')}</span>
                <span className="font-mono text-[10px] text-zinc-600">
                  {format(d, 'd')}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.07]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14" />
    </>
  )
}
