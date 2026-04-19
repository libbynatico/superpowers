'use client'

import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Calendar, ExternalLink, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'

interface CalEvent {
  id: string
  title: string
  start_time: string | null
  end_time: string | null
  description: string | null
  location: string | null
  html_link: string | null
}

type Status = 'idle' | 'loading' | 'not_connected' | 'error' | 'loaded'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setStatus('loading')
    try {
      const res = await fetch('/api/connectors/google-calendar/events')
      if (res.status === 400) {
        setStatus('not_connected')
        return
      }
      if (res.status === 401) {
        setErrorMsg('Your Google token has expired. Please reconnect.')
        setStatus('error')
        return
      }
      if (!res.ok) {
        const d = await res.json()
        setErrorMsg(d.error ?? 'Failed to fetch events')
        setStatus('error')
        return
      }
      const data = await res.json()
      setEvents(data.events ?? [])
      setStatus('loaded')
    } catch {
      setStatus('error')
      setErrorMsg('Network error fetching calendar events.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Calendar</h1>
          <p className="text-sm text-stone-500 mt-0.5">Upcoming events from Google Calendar</p>
        </div>
        {status === 'loaded' && (
          <button
            onClick={loadEvents}
            className="text-sm text-violet-600 hover:text-violet-800 font-medium"
          >
            Refresh
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="text-sm text-stone-400 text-center py-16">Loading…</div>
      )}

      {status === 'not_connected' && (
        <EmptyState
          icon={Calendar}
          title="Google Calendar not connected"
          description="Connect your Google Calendar to see your upcoming events here."
          actionHref="/connectors"
        />
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-700 mb-3">{errorMsg}</p>
          <Link
            href="/connectors"
            className="text-sm font-medium text-violet-700 hover:text-violet-900"
          >
            Go to Connectors →
          </Link>
        </div>
      )}

      {status === 'loaded' && events.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="No upcoming events"
          description="Your Google Calendar is connected but has no events in the next 30 days."
        />
      )}

      {status === 'loaded' && events.length > 0 && (
        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white border border-stone-200 rounded-xl px-4 py-4 hover:border-violet-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-stone-800">{ev.title}</div>

                  {ev.start_time && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatEventTime(ev.start_time, ev.end_time)}
                    </div>
                  )}

                  {ev.location && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}

                  {ev.description && (
                    <p className="text-xs text-stone-400 mt-1.5 line-clamp-2">
                      {ev.description}
                    </p>
                  )}
                </div>

                {ev.html_link && (
                  <a
                    href={ev.html_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 text-stone-400 hover:text-violet-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatEventTime(start: string, end: string | null): string {
  const s = new Date(start)
  const dateStr = s.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = s.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  if (!end) return `${dateStr} at ${timeStr}`
  const e = new Date(end)
  const endTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${dateStr} · ${timeStr} – ${endTime}`
}
