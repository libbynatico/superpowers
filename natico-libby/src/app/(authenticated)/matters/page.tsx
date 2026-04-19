'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { FolderOpen, Plus, X, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Matter } from '@/types'

export default function MattersPage() {
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMatters()
  }, [])

  async function loadMatters() {
    const supabase = createClient()
    const { data } = await supabase
      .from('matters')
      .select('*')
      .order('updated_at', { ascending: false })
    setMatters(data ?? [])
    setLoading(false)
  }

  async function createMatter(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)

    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('matters')
      .insert({
        user_id: user.user!.id,
        title: title.trim(),
        description: description.trim() || null,
      })
      .select()
      .single()

    if (!error && data) {
      setMatters((prev) => [data, ...prev])
      setTitle('')
      setDescription('')
      setShowNew(false)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Matters</h1>
          <p className="text-sm text-stone-500 mt-0.5">Your active work items and case files</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New matter
        </button>
      </div>

      {/* New matter form */}
      {showNew && (
        <form
          onSubmit={createMatter}
          className="bg-white border border-violet-200 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-800">New matter</h2>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="p-1 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Matter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-1.5 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
      ) : matters.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No matters yet"
          description="Create your first matter to start organizing your work."
          action={{ label: 'Create matter', onClick: () => setShowNew(true) }}
        />
      ) : (
        <div className="space-y-2">
          {matters.map((m) => (
            <Link
              key={m.id}
              href={`/matters/${m.id}`}
              className="block bg-white border border-stone-200 rounded-xl px-4 py-3.5 hover:border-violet-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-800 truncate">
                    {m.title}
                  </div>
                  {m.description && (
                    <div className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                      {m.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.status === 'open'
                        ? 'bg-emerald-50 text-emerald-700'
                        : m.status === 'closed'
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-stone-400">
                <Clock className="w-3 h-3" />
                {new Date(m.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
