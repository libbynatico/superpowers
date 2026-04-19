import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { WorkspaceContext } from '@/types'

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

  // If Anthropic API key is configured, use Claude
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: buildSystemPrompt(context),
          messages: [{ role: 'user', content: message }],
        }),
      })
      const data = await res.json()
      const reply =
        data?.content?.[0]?.text ??
        'I encountered an issue with my AI backend. Here is what I know from your workspace: ' +
          summarizeContext(context)
      return NextResponse.json({ reply })
    } catch {
      // fall through to rule-based
    }
  }

  // Rule-based context-aware assistant
  const reply = ruleBasedReply(message, context)
  return NextResponse.json({ reply })
}

function buildSystemPrompt(ctx: WorkspaceContext): string {
  return `You are Libby, the NATICO workspace assistant — a knowledgeable, concise, and honest wizard-librarian. You help users manage matters, files, calendar events, and connectors.

Current workspace state:
- Page: ${ctx.route || 'unknown'}
- Matters: ${ctx.mattersCount}
- Files: ${ctx.filesCount}
- Unread alerts: ${ctx.unreadAlertsCount}
- Connected providers: ${ctx.connectors.filter((c) => c.status === 'connected').map((c) => c.provider).join(', ') || 'none'}

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
    if (ctx.mattersCount === 0) {
      return "You don't have any matters yet. Go to the Matters page and create your first one to get started."
    }
    return `You have ${ctx.mattersCount} matter${ctx.mattersCount !== 1 ? 's' : ''}. Head to the Matters page to review or add to them.`
  }

  if (lower.includes('file') || lower.includes('upload') || lower.includes('document')) {
    if (ctx.filesCount === 0) {
      return "No files have been uploaded yet. Go to the Files page to upload your first document."
    }
    return `You have ${ctx.filesCount} file${ctx.filesCount !== 1 ? 's' : ''} uploaded. Visit the Files page to manage them.`
  }

  if (lower.includes('calendar') || lower.includes('event') || lower.includes('schedule')) {
    const calConnector = ctx.connectors.find((c) => c.provider === 'google_calendar')
    if (!calConnector || calConnector.status !== 'connected') {
      return "Google Calendar is not connected. Visit the Connectors page to link your calendar and see upcoming events."
    }
    return "Your Google Calendar is connected. Visit the Calendar page to see your upcoming events."
  }

  if (lower.includes('github') || lower.includes('repo') || lower.includes('repository')) {
    const ghConnector = ctx.connectors.find((c) => c.provider === 'github')
    if (!ghConnector || ghConnector.status !== 'connected') {
      return "GitHub is not connected. Visit the Connectors page to link your GitHub account for read-only repo access."
    }
    return "Your GitHub account is connected. Visit the Connectors page to view your repositories."
  }

  if (lower.includes('alert') || lower.includes('notification')) {
    if (ctx.unreadAlertsCount === 0) {
      return "You have no unread alerts. Your workspace is clear."
    }
    return `You have ${ctx.unreadAlertsCount} unread alert${ctx.unreadAlertsCount !== 1 ? 's' : ''}. Visit the Alerts page to review them.`
  }

  if (lower.includes('connector') || lower.includes('connect') || lower.includes('integration')) {
    const connected = ctx.connectors.filter((c) => c.status === 'connected')
    if (connected.length === 0) {
      return "No connectors are active. Visit the Connectors page to link Google Calendar or GitHub."
    }
    const names = connected.map((c) =>
      c.provider === 'google_calendar' ? 'Google Calendar' : 'GitHub',
    )
    return `Connected: ${names.join(', ')}. Visit the Connectors page to manage your integrations.`
  }

  if (lower.includes('help') || lower.includes('what can you do')) {
    return "I can help you navigate your workspace. Ask me about matters, files, alerts, calendar events, or connectors. I'll tell you exactly what's in your workspace — no guessing."
  }

  // Generic fallback
  return `I'm not sure how to answer that specifically. Your current workspace has ${summarizeContext(ctx)} Ask me about matters, files, alerts, calendar events, or connectors and I'll give you a direct answer.`
}
