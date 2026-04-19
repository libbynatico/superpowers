'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Volume2, VolumeX, RotateCcw, StopCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { VoiceComposer } from './VoiceComposer'
import { LibbyAvatar, Avatar } from '@/components/ui/Avatar'
import type { LibbyMessage, WorkspaceContext } from '@/types'

type AssistantMode = 'checking' | 'live' | 'rule-based' | 'error'

interface LibbyChatProps {
  context: WorkspaceContext
  profile: { display_name: string } | null
}

export function LibbyChat({ context, profile }: LibbyChatProps) {
  const pathname = usePathname()
  const [messages, setMessages] = useState<LibbyMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [spokenReplies, setSpokenReplies] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastReply, setLastReply] = useState<string | null>(null)
  const [mode, setMode] = useState<AssistantMode>('checking')
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Check BYOK status and set welcome message on mount
  useEffect(() => {
    fetch('/api/libby/status')
      .then((r) => r.json())
      .then((data) => {
        const resolvedMode: AssistantMode = data.mode === 'live' ? 'live' : 'rule-based'
        setMode(resolvedMode)
        setActiveModel(data.model ?? null)
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: buildWelcome(context, pathname, resolvedMode),
            timestamp: new Date(),
          },
        ])
      })
      .catch(() => {
        setMode('rule-based')
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: buildWelcome(context, pathname, 'rule-based'),
            timestamp: new Date(),
          },
        ])
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = useCallback(
    (text: string) => {
      if (!spokenReplies || !window.speechSynthesis) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    },
    [spokenReplies],
  )

  function stopSpeaking() {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }

  function replayLastReply() {
    if (lastReply) speak(lastReply)
  }

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

      // Update mode from response
      if (data.source === 'live') setMode('live')
      else if (data.source === 'error') setMode('error')
      else if (data.source === 'rule-based') setMode('rule-based')

      const replyText = data.reply as string
      setLastReply(replyText)

      const assistantMsg: LibbyMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      speak(replyText)

      // If provider errored, also show the rule-based fallback as a note
      if (data.source === 'error' && data.fallback) {
        const fallbackMsg: LibbyMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Rule-based guidance: ${data.fallback}`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, fallbackMsg])
      }
    } catch {
      setMode('error')
      const errMsg: LibbyMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I could not reach my backend. Please try again.',
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <LibbyAvatar size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-stone-800">Libby</div>
            <ModeBadge mode={mode} model={activeModel} />
          </div>
        </div>

        {/* Voice controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {lastReply && (
            <button
              onClick={replayLastReply}
              className="p-1.5 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              title="Replay last reply"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Stop speaking"
            >
              <StopCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => {
              setSpokenReplies((v) => {
                if (v) stopSpeaking()
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

function ModeBadge({ mode, model }: { mode: AssistantMode; model: string | null }) {
  if (mode === 'checking') {
    return <div className="text-xs text-stone-300">Initializing…</div>
  }
  if (mode === 'live') {
    const shortModel = model?.split('/').pop() ?? 'AI'
    return (
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        <span className="text-xs text-emerald-700 truncate">{shortModel}</span>
      </div>
    )
  }
  if (mode === 'error') {
    return (
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        <span className="text-xs text-red-600">AI error · rule-based</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
      <span className="text-xs text-stone-400">Rule-based</span>
    </div>
  )
}

function buildWelcome(
  ctx: WorkspaceContext,
  pathname: string,
  mode: AssistantMode | 'live' | 'rule-based',
): string {
  const name = ctx.profile?.display_name?.split(' ')[0] ?? 'there'
  const page = pathname.replace(/^\//, '') || 'dashboard'
  const parts: string[] = [`Hello, ${name}. You're on the ${page} page.`]

  const summaryParts: string[] = []
  if (ctx.mattersCount === 0) summaryParts.push('no matters yet')
  else summaryParts.push(`${ctx.mattersCount} matter${ctx.mattersCount !== 1 ? 's' : ''}`)

  if (ctx.filesCount === 0) summaryParts.push('no files uploaded')
  else summaryParts.push(`${ctx.filesCount} file${ctx.filesCount !== 1 ? 's' : ''}`)

  if (ctx.unreadAlertsCount > 0)
    summaryParts.push(
      `${ctx.unreadAlertsCount} unread alert${ctx.unreadAlertsCount !== 1 ? 's' : ''}`,
    )

  parts.push(`Your workspace has ${summaryParts.join(', ')}.`)

  const connectedProviders = ctx.connectors
    .filter((c) => c.status === 'connected')
    .map((c) => (c.provider === 'google_calendar' ? 'Google Calendar' : 'GitHub'))

  if (connectedProviders.length === 0) {
    parts.push('No connectors active.')
  } else {
    parts.push(`Connectors: ${connectedProviders.join(', ')}.`)
  }

  if (mode === 'rule-based') {
    parts.push('I am in rule-based mode. Add your OpenRouter key in Settings for live AI replies.')
  }

  parts.push('What would you like to do?')
  return parts.join(' ')
}
