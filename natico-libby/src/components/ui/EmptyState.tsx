'use client'

import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  actionHref?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-violet-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-stone-800 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-md transition-colors"
        >
          {action.label}
        </button>
      )}
      {actionHref && !action && (
        <a
          href={actionHref}
          className="mt-5 inline-block px-4 py-2 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-md transition-colors"
        >
          Get started
        </a>
      )}
    </div>
  )
}
