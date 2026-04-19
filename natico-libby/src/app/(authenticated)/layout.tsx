import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavRail } from '@/components/layout/NavRail'
import { AssistantRail } from '@/components/layout/AssistantRail'
import { ShellClient } from '@/components/layout/ShellClient'
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

  const [profileRes, connectorRes, mattersRes, filesRes, alertsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('connectors').select('*').eq('user_id', user.id),
    supabase
      .from('matters')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  const profile = profileRes.data as Profile | null
  const connectors = (connectorRes.data ?? []) as Connector[]

  // route is read by LibbyChat via usePathname() on the client
  const context: WorkspaceContext = {
    route: '',
    profile,
    mattersCount: mattersRes.count ?? 0,
    filesCount: filesRes.count ?? 0,
    unreadAlertsCount: alertsRes.count ?? 0,
    connectors,
    upcomingEventsCount: 0,
  }

  return (
    <ShellClient
      navRail={<NavRail profile={profile} isAdmin={profile?.role === 'admin'} />}
      assistantRail={<AssistantRail context={context} profile={profile} />}
    >
      {children}
    </ShellClient>
  )
}
