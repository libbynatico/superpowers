import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/connectors?error=google_oauth_failed`)
  }

  let userId: string
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = parsed.userId
  } catch {
    return NextResponse.redirect(`${appUrl}/connectors?error=invalid_state`)
  }

  const redirectUri = `${appUrl}/api/connectors/google-calendar/callback`

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.redirect(`${appUrl}/connectors?error=google_token_exchange_failed`)
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('connectors').upsert(
    {
      user_id: userId,
      provider: 'google_calendar',
      status: 'connected',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expiry: expiresAt,
      metadata: { scope: tokens.scope },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' },
  )

  if (dbError) {
    return NextResponse.redirect(`${appUrl}/connectors?error=google_db_error`)
  }

  return NextResponse.redirect(`${appUrl}/connectors?connected=google_calendar`)
}
