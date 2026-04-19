'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { Bell, AlertTriangle, Info, CheckCheck } from 'lucide-react'
import type { Alert } from '@/types'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  async function loadAlerts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
    setAlerts(data ?? [])
    setLoading(false)
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('alerts').update({ read: true }).eq('id', id)
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
  }

  async function markAllRead() {
    const supabase = createClient()
    const unread = alerts.filter((a) => !a.read).map((a) => a.id)
    if (unread.length === 0) return
    await supabase.from('alerts').update({ read: true }).in('id', unread)
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
  }

  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Alerts</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No active alerts"
          description="Alerts from your connected services will appear here."
        />
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`bg-white border rounded-xl px-4 py-3.5 ${
                a.read ? 'border-stone-200 opacity-60' : 'border-stone-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <SeverityIcon severity={a.severity} />
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold ${a.read ? 'text-stone-500' : 'text-stone-800'}`}
                  >
                    {a.title}
                  </div>
                  {a.message && (
                    <div className="text-xs text-stone-500 mt-1">{a.message}</div>
                  )}
                  <div className="text-xs text-stone-400 mt-1.5">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
                {!a.read && (
                  <button
                    onClick={() => markRead(a.id)}
                    className="flex-shrink-0 text-xs text-violet-600 hover:text-violet-800 font-medium"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'error') {
    return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
  }
  if (severity === 'warning') {
    return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
  }
  return <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
}
