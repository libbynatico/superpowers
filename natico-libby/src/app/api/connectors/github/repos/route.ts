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
    .select('access_token, status')
    .eq('user_id', user.id)
    .eq('provider', 'github')
    .single()

  if (!connector || connector.status !== 'connected' || !connector.access_token) {
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
  }

  const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=20&type=all', {
    headers: {
      Authorization: `Bearer ${connector.access_token}`,
      Accept: 'application/vnd.github+json',
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch repos from GitHub' },
      { status: res.status },
    )
  }

  const repos = await res.json()
  const simplified = repos.map((r: Record<string, unknown>) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    private: r.private,
    html_url: r.html_url,
    stargazers_count: r.stargazers_count,
    language: r.language,
    updated_at: r.updated_at,
  }))

  return NextResponse.json({ repos: simplified })
}
