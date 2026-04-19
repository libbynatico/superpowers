import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOKEN_URL = 'https://github.com/login/oauth/access_token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/connectors?error=github_oauth_failed`)
  }

  let userId: string
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = parsed.userId
  } catch {
    return NextResponse.redirect(`${appUrl}/connectors?error=invalid_state`)
  }

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${appUrl}/api/connectors/github/callback`,
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.redirect(`${appUrl}/connectors?error=github_token_failed`)
  }

  // Fetch GitHub user info
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  const ghUser = userRes.ok ? await userRes.json() : {}

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('connectors').upsert(
    {
      user_id: userId,
      provider: 'github',
      status: 'connected',
      access_token: tokens.access_token,
      refresh_token: null,
      token_expiry: null,
      metadata: {
        github_login: ghUser.login,
        github_name: ghUser.name,
        github_avatar: ghUser.avatar_url,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' },
  )

  if (dbError) {
    return NextResponse.redirect(`${appUrl}/connectors?error=github_db_error`)
  }

  return NextResponse.redirect(`${appUrl}/connectors?connected=github`)
}
