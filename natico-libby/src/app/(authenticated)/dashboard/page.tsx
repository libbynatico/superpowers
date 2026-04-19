import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FolderOpen,
  Files,
  Bell,
  Calendar,
  Plug,
  AlertTriangle,
  Plus,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [profileRes, mattersRes, filesRes, alertsRes, connectorRes] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user!.id).single(),
      supabase
        .from('matters')
        .select('*')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('files')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('connectors')
        .select('provider, status')
        .eq('user_id', user!.id),
    ])

  const profile = profileRes.data
  const matters = mattersRes.data ?? []
  const files = filesRes.data ?? []
  const alerts = alertsRes.data ?? []
  const connectors = connectorRes.data ?? []

  const connectedCount = connectors.filter((c) => c.status === 'connected').length

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          Good day, {profile?.display_name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Here is a snapshot of your NATICO workspace.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <StatCard
          label="Matters"
          value={matters.length}
          href="/matters"
          icon={FolderOpen}
          empty={matters.length === 0}
        />
        <StatCard
          label="Files"
          value={files.length}
          href="/files"
          icon={Files}
          empty={files.length === 0}
        />
        <StatCard
          label="Unread alerts"
          value={alerts.length}
          href="/alerts"
          icon={Bell}
          empty={alerts.length === 0}
          highlight={alerts.length > 0}
        />
        <StatCard
          label="Connectors"
          value={connectedCount}
          href="/connectors"
          icon={Plug}
          empty={connectedCount === 0}
        />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Recent matters */}
        <Section
          title="Recent matters"
          href="/matters"
          addHref="/matters"
        >
          {matters.length === 0 ? (
            <EmptyItem
              icon={FolderOpen}
              text="No matters yet"
              href="/matters"
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {matters.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/matters/${m.id}`}
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-stone-50 rounded transition-colors"
                  >
                    <span className="text-sm text-stone-800 truncate">{m.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${
                        m.status === 'open'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {m.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Recent files */}
        <Section title="Recent files" href="/files" addHref="/files">
          {files.length === 0 ? (
            <EmptyItem icon={Files} text="No files uploaded yet" href="/files" />
          ) : (
            <ul className="divide-y divide-stone-100">
              {files.map((f) => (
                <li key={f.id}>
                  <div className="flex items-center gap-2 py-2.5 px-1">
                    <Files className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <span className="text-sm text-stone-800 truncate">{f.name}</span>
                    <span className="text-xs text-stone-400 ml-auto flex-shrink-0">
                      {formatBytes(f.size)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Unread alerts */}
        <Section title="Unread alerts" href="/alerts">
          {alerts.length === 0 ? (
            <EmptyItem icon={Bell} text="No unread alerts" />
          ) : (
            <ul className="divide-y divide-stone-100">
              {alerts.map((a) => (
                <li key={a.id} className="py-2.5 px-1">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        a.severity === 'error'
                          ? 'text-red-500'
                          : a.severity === 'warning'
                            ? 'text-amber-500'
                            : 'text-blue-500'
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium text-stone-800">
                        {a.title}
                      </div>
                      {a.message && (
                        <div className="text-xs text-stone-500 mt-0.5">{a.message}</div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Connectors */}
        <Section title="Connectors" href="/connectors" addHref="/connectors">
          {connectors.length === 0 ? (
            <EmptyItem
              icon={Plug}
              text="No connectors configured"
              href="/connectors"
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {connectors.map((c) => (
                <li key={c.provider} className="flex items-center justify-between py-2.5 px-1">
                  <span className="text-sm text-stone-800 capitalize">
                    {c.provider === 'google_calendar' ? 'Google Calendar' : 'GitHub'}
                  </span>
                  <StatusBadge status={c.status} />
                </li>
              ))}
              {connectors.length < 2 && (
                <li className="py-2.5 px-1">
                  <Link
                    href="/connectors"
                    className="text-sm text-violet-600 hover:text-violet-800 font-medium"
                  >
                    + Add connector
                  </Link>
                </li>
              )}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  empty,
  highlight,
}: {
  label: string
  value: number
  href: string
  icon: React.ElementType
  empty: boolean
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-stone-200 rounded-xl p-4 hover:border-violet-200 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <Icon
          className={`w-4 h-4 ${highlight ? 'text-amber-500' : empty ? 'text-stone-300' : 'text-violet-500'}`}
          strokeWidth={1.75}
        />
      </div>
      <div
        className={`text-2xl font-bold ${highlight ? 'text-amber-600' : empty ? 'text-stone-300' : 'text-stone-900'}`}
      >
        {value}
      </div>
      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
    </Link>
  )
}

function Section({
  title,
  href,
  addHref,
  children,
}: {
  title: string
  href: string
  addHref?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <Link href={href} className="text-sm font-semibold text-stone-800 hover:text-violet-700">
          {title}
        </Link>
        {addHref && (
          <Link
            href={addHref}
            className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="px-3 py-1">{children}</div>
    </div>
  )
}

function EmptyItem({
  icon: Icon,
  text,
  href,
}: {
  icon: React.ElementType
  text: string
  href?: string
}) {
  const content = (
    <div className="flex items-center gap-2 py-3 px-1 text-stone-400">
      <Icon className="w-4 h-4" strokeWidth={1.5} />
      <span className="text-sm">{text}</span>
    </div>
  )
  return href ? (
    <Link href={href} className="hover:text-stone-600 transition-colors block">
      {content}
    </Link>
  ) : (
    content
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === 'connected'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'error'
        ? 'bg-red-50 text-red-700'
        : 'bg-stone-100 text-stone-500'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors}`}>
      {status}
    </span>
  )
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
