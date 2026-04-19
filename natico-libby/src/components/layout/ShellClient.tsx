'use client'

import { useState } from 'react'
import { Menu, MessageSquare, X } from 'lucide-react'
import { LibbyAvatar } from '@/components/ui/Avatar'

interface ShellClientProps {
  navRail: React.ReactNode
  assistantRail: React.ReactNode
  children: React.ReactNode
}

export function ShellClient({ navRail, assistantRail, children }: ShellClientProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileAssistantOpen, setMobileAssistantOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Desktop nav rail */}
      <div className="hidden md:flex flex-shrink-0">{navRail}</div>

      {/* Mobile: nav drawer overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 flex-shrink-0">{navRail}</div>
        </div>
      )}

      {/* Center content column */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-10 flex items-center justify-between px-4 h-14 bg-white border-b border-stone-200 flex-shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -ml-2 text-stone-600 hover:bg-stone-100 rounded-lg"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <LibbyAvatar size="sm" />
            <span className="text-sm font-bold text-stone-900">NATICO</span>
          </div>
          <button
            onClick={() => setMobileAssistantOpen(true)}
            className="p-2 -mr-2 text-stone-600 hover:bg-stone-100 rounded-lg"
            aria-label="Open Libby"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      {/* Desktop assistant rail */}
      <div className="hidden lg:flex flex-shrink-0">{assistantRail}</div>

      {/* Mobile: assistant bottom sheet */}
      {mobileAssistantOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileAssistantOpen(false)}
          />
          <div
            className="relative z-10 bg-white rounded-t-2xl overflow-hidden flex flex-col"
            style={{ height: '76vh' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <LibbyAvatar size="sm" />
                <span className="text-sm font-semibold text-stone-800">Libby</span>
              </div>
              <button
                onClick={() => setMobileAssistantOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{assistantRail}</div>
          </div>
        </div>
      )}
    </div>
  )
}
