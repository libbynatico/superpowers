import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { WorkspaceContext } from '@/types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'openai/gpt-4o-mini'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const message = (body.message as string) ?? ''
  const context = (body.context as WorkspaceContext) ?? {}

  // Resolve API key: user's BYOK key → server env fallback → rule-based
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('openrouter_api_key, openrouter_model')
    .eq('user_id', user.id)
    .single()

  const apiKey = prefs?.openrouter_api_key || process.env.OPENROUTER_API_KEY
  const model = prefs?.openrouter_model || DEFAULT_MODEL

  if (apiKey) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://natico.netlify.app'
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': appUrl,
          'X-Title': 'NATICO Libby Live',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 900,
          messages: [
            { role: 'system', content: buildSystemPrompt(context) },
            { role: 'user', content: message },
          ],
        }),
      })

      const data = await res.json()
      const reply =
        data?.choices?.[0]?.message?.content ??
        'I reached OpenRouter but got an unexpected response. ' + summarizeContext(context)
      return NextResponse.json({ reply, model, source: 'openrouter' })
    } catch {
      // fall through to rule-based
    }
  }

  // Rule-based fallback — works with zero API keys
  const reply = ruleBasedReply(message, context)
  return NextResponse.json({ reply, source: 'rule-based' })
}

function buildSystemPrompt(ctx: WorkspaceContext): string {
  const connected = ctx.connectors
    .filter((c) => c.status === 'connected')
    .map((c) => (c.provider === 'google_calendar' ? 'Google Calendar' : 'GitHub'))
    .join(', ') || 'none'

  return `You are Libby, the NATICO workspace assistant — a knowledgeable, concise, and honest wizard-librarian. You help users manage matters, files, calendar events, and connectors.

Current workspace state:
- Page: ${ctx.route || 'unknown'}
- Matters: ${ctx.mattersCount}
- Files: ${ctx.filesCount}
- Unread alerts: ${ctx.unreadAlertsCount}
- Connected providers: ${connected}

Rules:
- Never fabricate data you don't have.
- If a connector is disconnected, say so honestly.
- Recommend specific next steps.
- Keep replies under 120 words.
- Do not use markdown in responses.`
}

function summarizeContext(ctx: WorkspaceContext): string {
  const connected = ctx.connectors
    .filter((c) => c.status === 'connected')
    .map((c) => c.provider)
    .join(', ')
  return `${ctx.mattersCount} matters, ${ctx.filesCount} files, ${ctx.unreadAlertsCount} unread alerts, connectors: ${connected || 'none'}.`
}

function ruleBasedReply(message: string, ctx: WorkspaceContext): string {
  const lower = message.toLowerCase()

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello! I'm Libby, your NATICO workspace assistant. ${summarizeContext(ctx)} What would you like to work on?`
  }
  if (lower.includes('matter')) {
    if (ctx.mattersCount === 0) return "You don't have any matters yet. Go to the Matters page and create your first one to get started."
    return `You have ${ctx.mattersCount} matter${ctx.mattersCount !== 1 ? 's' : ''}. Head to the Matters page to review or add to them.`
  }
  if (lower.includes('file') || lower.includes('upload') || lower.includes('document')) {
    if (ctx.filesCount === 0) return "No files have been uploaded yet. Go to the Files page to upload your first document."
    return `You have ${ctx.filesCount} file${ctx.filesCount !== 1 ? 's' : ''} uploaded. Visit the Files page to manage them.`
  }
  if (lower.includes('calendar') || lower.includes('event') || lower.includes('schedule')) {
    const cal = ctx.connectors.find((c) => c.provider === 'google_calendar')
    if (!cal || cal.status !== 'connected') return "Google Calendar is not connected. Visit the Connectors page to link your calendar."
    return "Your Google Calendar is connected. Visit the Calendar page to see your upcoming events."
  }
  if (lower.includes('github') || lower.includes('repo')) {
    const gh = ctx.connectors.find((c) => c.provider === 'github')
    if (!gh || gh.status !== 'connected') return "GitHub is not connected. Visit the Connectors page to link your account."
    return "Your GitHub account is connected. Visit the Connectors page to view your repositories."
  }
  if (lower.includes('alert') || lower.includes('notification')) {
    if (ctx.unreadAlertsCount === 0) return "You have no unread alerts. Your workspace is clear."
    return `You have ${ctx.unreadAlertsCount} unread alert${ctx.unreadAlertsCount !== 1 ? 's' : ''}. Visit the Alerts page to review them.`
  }
  if (lower.includes('key') || lower.includes('openrouter') || lower.includes('api')) {
    return "To enable AI-powered replies, go to Settings and enter your OpenRouter API key. OpenRouter supports many models including GPT-4o, Claude, and Gemini."
  }
  if (lower.includes('help') || lower.includes('what can you do')) {
    return "I can help you navigate your workspace. Ask me about matters, files, alerts, calendar, or connectors. Add your OpenRouter API key in Settings for full AI replies."
  }
  return `I'm running in basic mode — add your OpenRouter API key in Settings to enable full AI replies. Your workspace: ${summarizeContext(ctx)}`
}
