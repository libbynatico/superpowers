'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LibbyAvatar } from '@/components/ui/Avatar'
import { Eye, EyeOff } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LibbyAvatar size="lg" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Welcome to NATICO</h1>
          <p className="text-sm text-stone-500 mt-1">Sign in to your workspace</p>
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
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
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
              autoComplete="current-password"
              placeholder="••••••••"
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-stone-500 mt-4">
            No account?{' '}
            <Link href="/register" className="text-violet-600 hover:text-violet-800 font-medium">
              Register
            </Link>
          </p>
        </form>

        {/* Demo credentials */}
        <div className="mt-4 bg-violet-50 border border-violet-100 rounded-xl p-4 text-xs text-violet-800">
          <div className="font-semibold mb-2">Demo credentials</div>
          <div className="flex flex-col gap-1">
            <span>
              <strong>#001 (Libby Natico):</strong> mattherbert01@gmail.com
            </span>
            <span className="text-violet-600">Password set during DB seed</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
