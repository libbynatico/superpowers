import Link from 'next/link'
import { LibbyAvatar } from '@/components/ui/Avatar'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 flex items-center h-14 gap-3">
          <Link
            href="/"
            className="text-stone-400 hover:text-stone-700 flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> NATICO
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <LibbyAvatar size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-stone-900">About NATICO</h1>
            <p className="text-sm text-violet-600 font-medium">Libby Live workspace</p>
          </div>
        </div>

        <div className="prose prose-stone max-w-none text-sm text-stone-700 space-y-4">
          <p>
            NATICO is a structured, authenticated workspace built around Libby — a persistent
            intelligent assistant that helps you manage matters, documents, calendar events,
            and external connectors.
          </p>
          <p>
            Libby appears in the right panel of every authenticated page. She can answer questions
            about your current workspace state, guide you to next steps, and accept voice input
            through browser speech recognition.
          </p>
          <p>
            NATICO is deliberately honest: empty states show truthfully when data is missing.
            Libby never invents files, events, or matters you haven&rsquo;t created.
          </p>
          <p>
            This is a live demo environment, not a production system. Connector OAuth flows
            require valid Google and GitHub OAuth app credentials configured in the environment.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/login"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 rounded-lg transition-colors"
          >
            Open workspace
          </Link>
        </div>
      </main>
    </div>
  )
}
