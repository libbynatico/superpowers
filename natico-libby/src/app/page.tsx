import Link from 'next/link'
import { LibbyAvatar } from '@/components/ui/Avatar'
import { ArrowRight, FolderOpen, Calendar, Github, MessageSquare, Files } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <LibbyAvatar size="sm" />
            <span className="font-bold text-stone-900">NATICO</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-stone-600">
            <Link href="/about" className="hover:text-stone-900">About</Link>
            <Link href="/services" className="hover:text-stone-900">Services</Link>
            <Link href="/resources" className="hover:text-stone-900">Resources</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="flex justify-center mb-6">
          <LibbyAvatar size="lg" />
        </div>
        <h1 className="text-4xl font-bold text-stone-900 mb-4 text-balance">
          Your intelligent workspace,{' '}
          <span className="text-violet-700">guided by Libby</span>
        </h1>
        <p className="text-lg text-stone-500 max-w-xl mx-auto mb-8 text-balance">
          NATICO organizes your matters, files, calendar, and connectors in one calm,
          structured workspace — with Libby always on hand.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 rounded-xl transition-colors"
          >
            Open workspace
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-colors"
          >
            Learn more
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: FolderOpen,
              title: 'Matters',
              desc: 'Organize your work into structured, trackable matters.',
            },
            {
              icon: Files,
              title: 'Files',
              desc: 'Upload and associate documents with matters securely.',
            },
            {
              icon: Calendar,
              title: 'Calendar',
              desc: 'See your real upcoming events from Google Calendar.',
            },
            {
              icon: Github,
              title: 'GitHub',
              desc: 'Read-only view of your repositories, no write access.',
            },
            {
              icon: MessageSquare,
              title: 'Libby assistant',
              desc: 'Context-aware guidance, text and voice, always accessible.',
            },
            {
              icon: ArrowRight,
              title: 'Honest empty states',
              desc: 'No fabricated data. Your workspace reflects reality.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white border border-stone-200 rounded-xl p-5"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-violet-600" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 mb-1">{title}</h3>
              <p className="text-xs text-stone-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-stone-400">
          <span>© 2025 NATICO / Libby Live</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-stone-600">About</Link>
            <Link href="/login" className="hover:text-stone-600">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
