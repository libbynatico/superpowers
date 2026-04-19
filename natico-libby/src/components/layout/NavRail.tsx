'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  Files,
  Bell,
  Calendar,
  Plug,
  MessageSquare,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Avatar, LibbyAvatar } from '@/components/ui/Avatar'
import type { Profile } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matters', label: 'Matters', icon: FolderOpen },
  { href: '/files', label: 'Files', icon: Files },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/connectors', label: 'Connectors', icon: Plug },
  { href: '/libby', label: 'Libby', icon: MessageSquare },
]

interface NavRailProps {
  profile: Profile | null
  isAdmin?: boolean
}

export function NavRail({ profile, isAdmin }: NavRailProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="flex flex-col h-full bg-white border-r border-stone-200 w-60 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-stone-100">
        <LibbyAvatar size="sm" />
        <div>
          <div className="text-sm font-bold text-stone-900 leading-none">NATICO</div>
          <div className="text-xs text-violet-600 font-medium leading-none mt-0.5">
            Libby Live
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors mx-2 rounded-md ${
                active
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? 'text-violet-600' : 'text-stone-400'}`}
                strokeWidth={active ? 2 : 1.75}
              />
              {label}
            </Link>
          )
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors mx-2 rounded-md ${
              pathname === '/admin'
                ? 'bg-violet-50 text-violet-700'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 flex-shrink-0 ${pathname === '/admin' ? 'text-violet-600' : 'text-stone-400'}`}
              strokeWidth={1.75}
            />
            Admin
          </Link>
        )}
      </div>

      {/* Bottom: settings + user */}
      <div className="border-t border-stone-100 py-2">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors mx-2 rounded-md ${
            pathname === '/settings'
              ? 'bg-violet-50 text-violet-700'
              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
          }`}
        >
          <Settings className="w-4 h-4 text-stone-400" strokeWidth={1.75} />
          Settings
        </Link>

        <div className="flex items-center justify-between px-4 py-3 mt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={profile?.display_name ?? 'U'} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-stone-800 truncate">
                {profile?.display_name ?? '—'}
              </div>
              <div className="text-xs text-stone-400">
                #{profile?.user_code ?? '—'}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
