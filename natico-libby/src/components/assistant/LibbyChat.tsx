'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { VoiceComposer } from './VoiceComposer'
import { LibbyAvatar } from '@/components/ui/Avatar'
import { Avatar } from '@/components/ui/Avatar'
import type { LibbyMessage, WorkspaceContext } from '@/types'

interface LibbyChatProps {
  context: WorkspaceContext
  profile: { display_name: string } | null
}

export function LibbyChat({ context, profile }: LibbyChatProps) {
  const [messages, setMessages] = useState<LibbyMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: buildWelcome(context),
      timestamp: new Date(),
    },
  ])
  const [loading, setLoading] = useState(false)
  const [spokenReplies, setSpokenReplies] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = useCallback((text: string) => {
    if (!spokenReplies || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }, [spokenReplies])

  async function handleSend(text: string) {
    const userMsg: LibbyMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/libby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
      })
      const data = await res.json()
      const reply = data.reply as string

      const assistantMsg: LibbyMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      speak(reply)
    } catch {
      const errMsg: LibbyMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I ran into a problem reaching my backend. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-white">
        <div className="flex items-center gap-2.5">
          <LibbyAvatar size="sm" />
          <div>
            <div className="text-sm font-semibold text-stone-800">Libby</div>
            <div className="text-xs text-stone-400">Your workspace assistant</div>
          </div>
        </div>
        <button
          onClick={() => {
            setSpokenReplies((v) => {
              if (v) window.speechSynthesis?.cancel()
              return !v
            })
          }}
          className={`p-1.5 rounded transition-colors ${
            spokenReplies
              ? 'text-violet-600 bg-violet-50'
              : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
          }`}
          title={spokenReplies ? 'Mute spoken replies' : 'Enable spoken replies'}
        >
          {spokenReplies ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'assistant' ? (
              <LibbyAvatar size="sm" />
            ) : (
              <Avatar name={profile?.display_name ?? 'U'} size="sm" />
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-700 text-white rounded-tr-sm'
                  : 'bg-stone-100 text-stone-800 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center">
            <LibbyAvatar size="sm" />
            <div className="bg-stone-100 rounded-xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <VoiceComposer onSend={handleSend} disabled={loading} />
    </div>
  )
}

function buildWelcome(ctx: WorkspaceContext): string {
  const name = ctx.profile?.display_name?.split(' ')[0] ?? 'there'
  const parts: string[] = [`Hello, ${name}.`]

  const route = ctx.route.replace(/^\//, '') || 'dashboard'
  parts.push(`You're on the ${route} page.`)

  const summaryParts: string[] = []
  if (ctx.mattersCount === 0) summaryParts.push('no matters yet')
  else summaryParts.push(`${ctx.mattersCount} matter${ctx.mattersCount !== 1 ? 's' : ''}`)

  if (ctx.filesCount === 0) summaryParts.push('no files uploaded')
  else summaryParts.push(`${ctx.filesCount} file${ctx.filesCount !== 1 ? 's' : ''}`)

  if (ctx.unreadAlertsCount > 0)
    summaryParts.push(`${ctx.unreadAlertsCount} unread alert${ctx.unreadAlertsCount !== 1 ? 's' : ''}`)

  if (summaryParts.length) {
    parts.push(`Your workspace has ${summaryParts.join(', ')}.`)
  }

  const connectedProviders = ctx.connectors
    .filter((c) => c.status === 'connected')
    .map((c) => (c.provider === 'google_calendar' ? 'Google Calendar' : 'GitHub'))

  if (connectedProviders.length === 0) {
    parts.push('No connectors are active. Visit Connectors to link Google Calendar or GitHub.')
  } else {
    parts.push(`Active connectors: ${connectedProviders.join(', ')}.`)
  }

  parts.push('What would you like to do?')
  return parts.join(' ')
}
