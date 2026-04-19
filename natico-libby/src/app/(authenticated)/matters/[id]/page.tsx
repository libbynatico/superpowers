import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Files, Clock } from 'lucide-react'

export default async function MatterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [matterRes, filesRes] = await Promise.all([
    supabase
      .from('matters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('files')
      .select('*')
      .eq('matter_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (matterRes.error || !matterRes.data) {
    notFound()
  }

  const matter = matterRes.data
  const files = filesRes.data ?? []

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link
        href="/matters"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Matters
      </Link>

      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-stone-900">{matter.title}</h1>
            {matter.description && (
              <p className="text-sm text-stone-600 mt-2">{matter.description}</p>
            )}
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
              matter.status === 'open'
                ? 'bg-emerald-50 text-emerald-700'
                : matter.status === 'closed'
                  ? 'bg-stone-100 text-stone-500'
                  : 'bg-amber-50 text-amber-700'
            }`}
          >
            {matter.status}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-4 text-xs text-stone-400">
          <Clock className="w-3 h-3" />
          Last updated {new Date(matter.updated_at).toLocaleString()}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-800">Files</h2>
          <Link
            href={`/files?matter=${id}`}
            className="text-xs text-violet-600 hover:text-violet-800 font-medium"
          >
            Upload file
          </Link>
        </div>

        {files.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-6 text-stone-400">
            <Files className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-sm">No files attached to this matter yet.</span>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <Files className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <span className="text-sm text-stone-800 truncate flex-1">{f.name}</span>
                <span className="text-xs text-stone-400">
                  {f.size ? formatBytes(f.size) : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
