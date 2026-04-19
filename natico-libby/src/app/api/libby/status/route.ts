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

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('openrouter_api_key, openrouter_model')
    .eq('user_id', user.id)
    .single()

  const hasKey = !!(prefs?.openrouter_api_key)

  return NextResponse.json({
    mode: hasKey ? 'live' : 'rule-based',
    hasKey,
    model: hasKey ? (prefs?.openrouter_model ?? 'openai/gpt-4o-mini') : null,
  })
}
