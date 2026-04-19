import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'

const resources = [
  {
    title: 'Supabase documentation',
    desc: 'Set up your database, auth, and storage.',
    href: 'https://supabase.com/docs',
  },
  {
    title: 'Google OAuth setup guide',
    desc: 'Create a Google Cloud OAuth app for calendar access.',
    href: 'https://developers.google.com/identity/protocols/oauth2',
  },
  {
    title: 'GitHub OAuth apps',
    desc: 'Register a GitHub OAuth app for repository access.',
    href: 'https://docs.github.com/en/apps/oauth-apps/building-oauth-apps',
  },
  {
    title: 'Next.js App Router docs',
    desc: 'Understanding the routing model used in this app.',
    href: 'https://nextjs.org/docs/app',
  },
]

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 flex items-center h-14">
          <Link
            href="/"
            className="text-stone-400 hover:text-stone-700 flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> NATICO
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Resources</h1>
        <p className="text-sm text-stone-500 mb-10">
          Setup guides and documentation for running this workspace.
        </p>

        <div className="space-y-3">
          {resources.map(({ title, desc, href }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-4 bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-violet-200 transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-stone-800">{title}</div>
                <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
            </a>
          ))}
        </div>

        <div className="mt-8 bg-violet-50 border border-violet-100 rounded-xl p-5">
          <p className="text-sm font-medium text-violet-900 mb-1">
            Setup in 3 steps
          </p>
          <ol className="text-sm text-violet-800 space-y-1 list-decimal list-inside">
            <li>Clone the repo and copy <code className="bg-violet-100 px-1 rounded">.env.example</code> to <code className="bg-violet-100 px-1 rounded">.env.local</code></li>
            <li>Run <code className="bg-violet-100 px-1 rounded">supabase start</code> and apply migrations</li>
            <li>Run <code className="bg-violet-100 px-1 rounded">npm run dev</code></li>
          </ol>
        </div>
      </main>
    </div>
  )
}
