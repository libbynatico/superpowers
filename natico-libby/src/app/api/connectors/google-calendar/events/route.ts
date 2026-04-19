import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: connector } = await supabase
    .from('connectors')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')
    .single()

  if (!connector || connector.status !== 'connected' || !connector.access_token) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const maxTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${maxTime}&orderBy=startTime&singleEvents=true&maxResults=20`,
    {
      headers: {
        Authorization: `Bearer ${connector.access_token}`,
      },
    },
  )

  if (res.status === 401) {
    // Token expired — mark connector as error
    await supabase
      .from('connectors')
      .update({ status: 'error' })
      .eq('id', connector.id)
    return NextResponse.json(
      { error: 'Google token expired. Please reconnect.' },
      { status: 401 },
    )
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch events from Google Calendar' },
      { status: res.status },
    )
  }

  const data = await res.json()
  const events = (data.items ?? []).map((e: Record<string, unknown>) => {
    const startRaw = (e.start as Record<string, string>) ?? {}
    const endRaw = (e.end as Record<string, string>) ?? {}
    return {
      id: e.id,
      title: e.summary ?? '(No title)',
      start_time: startRaw.dateTime ?? startRaw.date,
      end_time: endRaw.dateTime ?? endRaw.date,
      description: e.description ?? null,
      location: e.location ?? null,
      html_link: e.htmlLink,
    }
  })

  return NextResponse.json({ events })
}
