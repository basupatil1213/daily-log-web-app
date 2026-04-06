'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden border-r border-white/5">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* 24-hour decorative timeline */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-40">
          {DECORATIVE_HOURS.map(({ hour, color, width }) => (
            <div key={hour} className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-zinc-600 w-8 text-right">
                {String(hour).padStart(2, '0')}
              </span>
              <div
                className="h-5 rounded-sm transition-all"
                style={{
                  width: `${width}px`,
                  backgroundColor: color,
                  opacity: 0.7,
                }}
              />
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
              Chronicle
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-5xl font-bold text-zinc-100 leading-tight mb-6">
            Understand
            <br />
            where your
            <br />
            <span className="text-violet-400">time goes.</span>
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed max-w-xs">
            Log every hour of your day. See the patterns. Build the life you actually want.
          </p>
        </div>

        <div className="relative z-10 flex gap-6">
          {[
            { label: 'Hours tracked', value: '8,760' },
            { label: 'Per year', value: '365 days' },
            { label: 'Clarity', value: '∞' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="font-display font-bold text-xl text-zinc-100">{value}</div>
              <div className="text-zinc-600 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
              Chronicle
            </span>
          </div>

          <h2 className="font-display text-2xl font-bold text-zinc-100 mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            {mode === 'signin'
              ? 'Sign in to continue tracking your time.'
              : 'Start logging your hours today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5 font-mono">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full bg-surface-2 border border-white/7 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-surface-3 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-mono">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#18181C] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-[#1E1E24] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-mono">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-[#18181C] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-[#1E1E24] transition-all"
              />
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {message && (
              <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg px-4 py-2.5 transition-all duration-150 mt-2"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-600 mt-6">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
                setMessage(null)
              }}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Decorative 24-hour data for the left panel illustration
const DECORATIVE_HOURS: { hour: number; color: string; width: number }[] = [
  { hour: 0,  color: '#8B5CF6', width: 80 },
  { hour: 1,  color: '#8B5CF6', width: 80 },
  { hour: 2,  color: '#8B5CF6', width: 80 },
  { hour: 3,  color: '#8B5CF6', width: 80 },
  { hour: 4,  color: '#8B5CF6', width: 80 },
  { hour: 5,  color: '#8B5CF6', width: 80 },
  { hour: 6,  color: '#06B6D4', width: 50 },
  { hour: 7,  color: '#F97316', width: 50 },
  { hour: 8,  color: '#F59E0B', width: 120 },
  { hour: 9,  color: '#F59E0B', width: 120 },
  { hour: 10, color: '#F59E0B', width: 120 },
  { hour: 11, color: '#3B82F6', width: 100 },
  { hour: 12, color: '#F97316', width: 50 },
  { hour: 13, color: '#F59E0B', width: 120 },
  { hour: 14, color: '#F59E0B', width: 120 },
  { hour: 15, color: '#3B82F6', width: 100 },
  { hour: 16, color: '#F59E0B', width: 120 },
  { hour: 17, color: '#94A3B8', width: 60 },
  { hour: 18, color: '#10B981', width: 70 },
  { hour: 19, color: '#F97316', width: 50 },
  { hour: 20, color: '#EC4899', width: 90 },
  { hour: 21, color: '#EC4899', width: 90 },
  { hour: 22, color: '#A78BFA', width: 75 },
  { hour: 23, color: '#8B5CF6', width: 80 },
]
