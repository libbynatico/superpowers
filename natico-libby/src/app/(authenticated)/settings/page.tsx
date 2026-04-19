'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Check, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile, UserPreferences } from '@/types'

const OPENROUTER_MODELS = [
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o mini (fast, cheap)' },
  { value: 'openai/gpt-4o', label: 'GPT-4o (capable)' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (fast)' },
  { value: 'anthropic/claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (capable)' },
  { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5 (fast)' },
  { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
  { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (free tier)' },
]

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [spokenReplies, setSpokenReplies] = useState(false)
  const [openrouterKey, setOpenrouterKey] = useState('')
  const [openrouterModel, setOpenrouterModel] = useState('openai/gpt-4o-mini')
  const [showKey, setShowKey] = useState(false)
  const [keyPlaceholder, setKeyPlaceholder] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, prefsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
    ])

    const p = profileRes.data as Profile | null
    const pr = prefsRes.data as UserPreferences | null

    setProfile(p)
    setDisplayName(p?.display_name ?? '')
    setSpokenReplies(pr?.spoken_replies ?? false)
    setOpenrouterModel(pr?.openrouter_model ?? 'openai/gpt-4o-mini')

    // Show masked placeholder if key is already saved
    if (pr?.openrouter_api_key) {
      setKeyPlaceholder('sk-or-••••••••••••••••••••••••')
    }

    setLoading(false)
  }

  async function save() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)

    const prefsUpdate: Record<string, unknown> = {
      spoken_replies: spokenReplies,
      openrouter_model: openrouterModel,
    }
    // Only update the key if user typed a new one
    if (openrouterKey.trim()) {
      prefsUpdate.openrouter_api_key = openrouterKey.trim()
    }

    await Promise.all([
      supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id),
      supabase
        .from('user_preferences')
        .update(prefsUpdate)
        .eq('user_id', user.id),
    ])

    setSaving(false)
    setSaved(true)
    if (openrouterKey.trim()) {
      setKeyPlaceholder('sk-or-••••••••••••••••••••••••')
      setOpenrouterKey('')
    }
    setTimeout(() => setSaved(false), 2000)
  }

  async function clearKey() {
    if (!confirm('Remove your OpenRouter API key? Libby will fall back to basic mode.')) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('user_preferences')
      .update({ openrouter_api_key: null })
      .eq('user_id', user.id)
    setKeyPlaceholder('')
    setOpenrouterKey('')
  }

  if (loading) {
    return <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
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
            <div className="text-sm font-semibold text-stone-800">{displayName || '—'}</div>
            <div className="text-xs text-stone-400">
              #{profile?.user_code} · {profile?.role}
            </div>
          </div>
        </div>

        <label className="block mb-1 text-xs font-medium text-stone-600">Display name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </section>

      {/* Libby / OpenRouter BYOK */}
      <section className="bg-white border border-stone-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-stone-800">Libby assistant</h2>
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800"
          >
            Get an OpenRouter key
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Libby uses OpenRouter to power AI replies. Enter your own key (BYOK) or leave blank to
          use the shared server key. Without any key, Libby falls back to rule-based responses.
        </p>

        <label className="block mb-1 text-xs font-medium text-stone-600">
          OpenRouter API key
          {keyPlaceholder && (
            <span className="ml-2 text-emerald-600 font-normal">✓ key saved</span>
          )}
        </label>
        <div className="relative mb-3">
          <input
            type={showKey ? 'text' : 'password'}
            value={openrouterKey}
            onChange={(e) => setOpenrouterKey(e.target.value)}
            placeholder={keyPlaceholder || 'sk-or-…  (leave blank to keep existing)'}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {keyPlaceholder && (
          <button
            onClick={clearKey}
            className="text-xs text-red-500 hover:text-red-700 mb-3"
          >
            Remove saved key
          </button>
        )}

        <label className="block mb-1 text-xs font-medium text-stone-600">Model</label>
        <select
          value={openrouterModel}
          onChange={(e) => setOpenrouterModel(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white mb-4"
        >
          {OPENROUTER_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm text-stone-800">Enable spoken replies by default</div>
            <div className="text-xs text-stone-400 mt-0.5">
              Libby reads responses aloud using browser speech synthesis.
            </div>
          </div>
          <div
            onClick={() => setSpokenReplies((v) => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
              spokenReplies ? 'bg-violet-600' : 'bg-stone-200'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                spokenReplies ? 'translate-x-5' : 'translate-x-1'
              }`}
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
