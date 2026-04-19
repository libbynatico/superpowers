import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (action === 'disconnect') {
    await supabase
      .from('connectors')
      .upsert(
        {
          user_id: user.id,
          provider: 'github',
          status: 'disconnected',
          access_token: null,
          refresh_token: null,
          token_expiry: null,
          metadata: null,
        },
        { onConflict: 'user_id,provider' },
      )
    return NextResponse.redirect(`${appUrl}/connectors?disconnected=github`)
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/connectors?error=github_not_configured`)
  }

  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64url')
  const redirectUri = `${appUrl}/api/connectors/github/callback`

  const url = new URL(GITHUB_AUTH_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'read:user repo')
  url.searchParams.set('state', state)

  return NextResponse.redirect(url.toString())
}

// Save a GitHub Personal Access Token directly
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await request.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  // Verify the token by calling GitHub API
  const verifyRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!verifyRes.ok) {
    return NextResponse.json(
      { error: 'Invalid GitHub token' },
      { status: 400 },
    )
  }

  const ghUser = await verifyRes.json()

  const { error: dbError } = await supabase.from('connectors').upsert(
    {
      user_id: user.id,
      provider: 'github',
      status: 'connected',
      access_token: token,
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
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, login: ghUser.login })
}
