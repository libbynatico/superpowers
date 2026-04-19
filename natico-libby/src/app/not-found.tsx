import Link from 'next/link'
import { LibbyAvatar } from '@/components/ui/Avatar'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <LibbyAvatar size="lg" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900 mb-2">404</h1>
        <p className="text-stone-500 mb-6">This page doesn&rsquo;t exist in your workspace.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
