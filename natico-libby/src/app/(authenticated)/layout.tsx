import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NavRail } from '@/components/layout/NavRail'
import { AssistantRail } from '@/components/layout/AssistantRail'
import type { Profile, Connector, WorkspaceContext } from '@/types'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Parallel data fetching for workspace context
  const [profileRes, connectorRes, mattersRes, filesRes, alertsRes] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('connectors').select('*').eq('user_id', user.id),
      supabase.from('matters').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('files').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
    ])

  const profile = profileRes.data as Profile | null
  const connectors = (connectorRes.data ?? []) as Connector[]

  // Determine current route from request headers
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  const context: WorkspaceContext = {
    route: pathname,
    profile,
    mattersCount: mattersRes.count ?? 0,
    filesCount: filesRes.count ?? 0,
    unreadAlertsCount: alertsRes.count ?? 0,
    connectors,
    upcomingEventsCount: 0,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Left navigation rail */}
      <NavRail profile={profile} isAdmin={profile?.role === 'admin'} />

      {/* Center content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>

      {/* Right assistant rail */}
      <AssistantRail context={context} profile={profile} />
    </div>
  )
}
