import Link from 'next/link'
import { ArrowLeft, FolderOpen, Files, Calendar, Github, MessageSquare, Bell } from 'lucide-react'

const services = [
  {
    icon: FolderOpen,
    name: 'Matters',
    desc: 'Create and manage structured work items. Each matter can hold associated files and notes.',
  },
  {
    icon: Files,
    name: 'Document storage',
    desc: 'Upload documents up to 50 MB. Files are stored privately in Supabase Storage.',
  },
  {
    icon: Calendar,
    name: 'Calendar connector',
    desc: 'Read-only view of your upcoming Google Calendar events. Requires OAuth connection.',
  },
  {
    icon: Github,
    name: 'GitHub connector',
    desc: 'Read-only view of your repositories. Connect via OAuth or Personal Access Token.',
  },
  {
    icon: MessageSquare,
    name: 'Libby assistant',
    desc: 'Persistent AI assistant with text and voice input. Context-aware and never fabricates data.',
  },
  {
    icon: Bell,
    name: 'Alerts',
    desc: 'Workspace alerts and notifications. Mark as read individually or in bulk.',
  },
]

export default function ServicesPage() {
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
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Services</h1>
        <p className="text-sm text-stone-500 mb-10">
          What NATICO includes in this workspace demo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map(({ icon: Icon, name, desc }) => (
            <div
              key={name}
              className="bg-white border border-stone-200 rounded-xl p-5"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-violet-600" strokeWidth={1.75} />
              </div>
              <h2 className="text-sm font-semibold text-stone-800 mb-1">{name}</h2>
              <p className="text-xs text-stone-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/register"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </main>
    </div>
  )
}
