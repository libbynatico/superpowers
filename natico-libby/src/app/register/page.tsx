'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LibbyAvatar } from '@/components/ui/Avatar'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim() || email.split('@')[0],
          role: 'user',
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LibbyAvatar size="lg" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Create your workspace</h1>
          <p className="text-sm text-stone-500 mt-1">Join NATICO / Libby Live</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <label className="block text-xs font-medium text-stone-600 mb-1">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <label className="block text-xs font-medium text-stone-600 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <label className="block text-xs font-medium text-stone-600 mb-1">
            Password
          </label>
          <div className="relative mb-5">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating workspace…' : 'Create workspace'}
          </button>

          <p className="text-center text-xs text-stone-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-600 hover:text-violet-800 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
