'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Check } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile, UserPreferences } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [spokenReplies, setSpokenReplies] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, prefsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    ])

    const p = profileRes.data
    const pr = prefsRes.data

    setProfile(p)
    setPrefs(pr)
    setDisplayName(p?.display_name ?? '')
    setSpokenReplies(pr?.spoken_replies ?? false)
    setLoading(false)
  }

  async function save() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    await Promise.all([
      supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id),
      supabase
        .from('user_preferences')
        .update({ spoken_replies: spokenReplies })
        .eq('user_id', user.id),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <section className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-stone-800 mb-4">Profile</h2>

        <div className="flex items-center gap-3 mb-4">
          <Avatar name={displayName || 'U'} size="lg" />
          <div>
            <div className="text-sm font-semibold text-stone-800">
              {displayName || '—'}
            </div>
            <div className="text-xs text-stone-400">
              #{profile?.user_code} · {profile?.role}
            </div>
          </div>
        </div>

        <label className="block mb-1 text-xs font-medium text-stone-600">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-1"
        />
      </section>

      {/* Assistant */}
      <section className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-stone-800 mb-4">Libby assistant</h2>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm text-stone-800">Enable spoken replies by default</div>
            <div className="text-xs text-stone-400 mt-0.5">
              Libby will read responses aloud using browser speech synthesis.
            </div>
          </div>
          <div
            onClick={() => setSpokenReplies((v) => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors ${spokenReplies ? 'bg-violet-600' : 'bg-stone-200'}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${spokenReplies ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </div>
        </label>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors disabled:opacity-50"
      >
        {saved ? (
          <>
            <Check className="w-4 h-4" /> Saved
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save settings
          </>
        )}
      </button>
    </div>
  )
}
