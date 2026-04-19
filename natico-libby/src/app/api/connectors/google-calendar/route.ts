import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Disconnect action
  if (action === 'disconnect') {
    await supabase
      .from('connectors')
      .upsert(
        {
          user_id: user.id,
          provider: 'google_calendar',
          status: 'disconnected',
          access_token: null,
          refresh_token: null,
          token_expiry: null,
          metadata: null,
        },
        { onConflict: 'user_id,provider' },
      )
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/connectors?disconnected=google_calendar`)
  }

  // Initiate OAuth
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connectors?error=google_not_configured`,
    )
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/connectors/google-calendar/callback`
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64url')

  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString())
}
