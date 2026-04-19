'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Plug,
  Calendar,
  Github,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Key,
  X,
} from 'lucide-react'
import type { Connector } from '@/types'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ConnectorsContent() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [githubPat, setGithubPat] = useState('')
  const [savingPat, setSavingPat] = useState(false)
  const [patError, setPatError] = useState<string | null>(null)
  const [showPatInput, setShowPatInput] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    const connected = searchParams.get('connected')
    const disconnected = searchParams.get('disconnected')
    const error = searchParams.get('error')

    if (connected) {
      setToast(
        connected === 'google_calendar'
          ? 'Google Calendar connected successfully.'
          : 'GitHub connected successfully.',
      )
    } else if (disconnected) {
      setToast(
        disconnected === 'google_calendar'
          ? 'Google Calendar disconnected.'
          : 'GitHub disconnected.',
      )
    } else if (error) {
      setToast(`Connection error: ${error.replace(/_/g, ' ')}`)
    }

    loadConnectors()
  }, [searchParams])

  async function loadConnectors() {
    const supabase = createClient()
    const { data } = await supabase.from('connectors').select('*')
    setConnectors(data ?? [])
    setLoading(false)
  }

  function getConnector(provider: string): Connector | undefined {
    return connectors.find((c) => c.provider === provider)
  }

  async function savePat() {
    if (!githubPat.trim()) return
    setSavingPat(true)
    setPatError(null)

    try {
      const res = await fetch('/api/connectors/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubPat }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPatError(data.error ?? 'Failed to save token')
      } else {
        setToast(`GitHub connected as @${data.login}`)
        setGithubPat('')
        setShowPatInput(false)
        loadConnectors()
      }
    } catch {
      setPatError('Network error. Please try again.')
    } finally {
      setSavingPat(false)
    }
  }

  const gcal = getConnector('google_calendar')
  const github = getConnector('github')

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {toast && (
        <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 mb-6 text-sm text-violet-800">
          <span>{toast}</span>
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-stone-900">Connectors</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Link external services to your NATICO workspace
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
      ) : (
        <div className="space-y-4">
          {/* Google Calendar */}
          <ConnectorCard
            icon={<Calendar className="w-5 h-5 text-blue-500" />}
            name="Google Calendar"
            description="Read your upcoming events in the Calendar view."
            connector={gcal}
            connectAction={
              <a
                href="/api/connectors/google-calendar"
                className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors"
              >
                Connect
              </a>
            }
            disconnectAction={
              gcal?.status === 'connected' ? (
                <a
                  href="/api/connectors/google-calendar?action=disconnect"
                  className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-stone-200"
                >
                  Disconnect
                </a>
              ) : null
            }
          />

          {/* GitHub */}
          <ConnectorCard
            icon={<Github className="w-5 h-5 text-stone-800" />}
            name="GitHub"
            description="Read-only access to your repositories."
            connector={github}
            connectAction={
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <a
                    href="/api/connectors/github"
                    className="px-3 py-1.5 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors"
                  >
                    Connect via OAuth
                  </a>
                  <button
                    onClick={() => setShowPatInput(!showPatInput)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Use PAT
                  </button>
                </div>
                {showPatInput && (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="password"
                      placeholder="ghp_your_personal_access_token"
                      value={githubPat}
                      onChange={(e) => setGithubPat(e.target.value)}
                      className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                      onClick={savePat}
                      disabled={savingPat || !githubPat.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg disabled:opacity-50"
                    >
                      {savingPat ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                )}
                {patError && (
                  <p className="text-xs text-red-600">{patError}</p>
                )}
              </div>
            }
            disconnectAction={
              github?.status === 'connected' ? (
                <a
                  href="/api/connectors/github?action=disconnect"
                  className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-stone-200"
                >
                  Disconnect
                </a>
              ) : null
            }
          />

          {/* GitHub repos (when connected) */}
          {github?.status === 'connected' && <GitHubRepos />}
        </div>
      )}
    </div>
  )
}

function ConnectorCard({
  icon,
  name,
  description,
  connector,
  connectAction,
  disconnectAction,
}: {
  icon: React.ReactNode
  name: string
  description: string
  connector: Connector | undefined
  connectAction: React.ReactNode
  disconnectAction: React.ReactNode
}) {
  const isConnected = connector?.status === 'connected'
  const isError = connector?.status === 'error'

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-semibold text-stone-800">{name}</h2>
            <StatusBadge status={connector?.status ?? 'disconnected'} />
          </div>
          <p className="text-xs text-stone-500 mb-3">{description}</p>
          {isConnected ? (
            <div className="flex items-center gap-2">
              {connector?.metadata?.github_login && (
                <span className="text-xs text-stone-500">
                  @{connector.metadata.github_login as string}
                </span>
              )}
              {disconnectAction}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Token expired or invalid.</span>
              {connectAction}
            </div>
          ) : (
            connectAction
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
        <CheckCircle className="w-3 h-3" /> Connected
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-medium">
        <AlertCircle className="w-3 h-3" /> Error
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full font-medium">
      <XCircle className="w-3 h-3" /> Disconnected
    </span>
  )
}

function GitHubRepos() {
  const [repos, setRepos] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/connectors/github/repos')
      .then((r) => r.json())
      .then((d) => {
        if (d.repos) setRepos(d.repos)
        else setError(d.error ?? 'Failed to load repos')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-stone-400 py-4 text-center">Loading repositories…</div>
  if (error) return <div className="text-sm text-red-600 py-4 text-center">{error}</div>
  if (repos.length === 0) {
    return (
      <EmptyState
        icon={Github as React.ElementType}
        title="No repositories found"
        description="Your GitHub account is connected but has no accessible repositories."
      />
    )
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100 text-sm font-semibold text-stone-800">
        Your repositories ({repos.length})
      </div>
      <ul className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
        {repos.map((r) => (
          <li key={r.id as string} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <a
                  href={r.html_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-violet-700 hover:text-violet-900 truncate block"
                >
                  {r.full_name as string}
                </a>
                {r.description && (
                  <p className="text-xs text-stone-500 mt-0.5 truncate">
                    {r.description as string}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-xs text-stone-400">
                {r.private ? (
                  <span className="bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded text-xs">
                    private
                  </span>
                ) : null}
                {r.language && <span>{r.language as string}</span>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ConnectorsPage() {
  return (
    <Suspense>
      <ConnectorsContent />
    </Suspense>
  )
}
