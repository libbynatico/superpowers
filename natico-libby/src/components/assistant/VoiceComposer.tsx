'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Mic, MicOff, Square } from 'lucide-react'

interface VoiceComposerProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function VoiceComposer({ onSend, disabled }: VoiceComposerProps) {
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    const SR =
      (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SR) {
      alert('Speech recognition is not supported in this browser.')
      return
    }

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('')
      setText(transcript)
    }

    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 border-t border-stone-100">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Libby anything…"
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none text-sm text-stone-800 placeholder-stone-400 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white disabled:opacity-50"
        style={{ maxHeight: '96px', overflowY: 'auto' }}
      />
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
          isListening
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
        }`}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <Square className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="p-2 rounded-lg bg-violet-700 text-white hover:bg-violet-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
