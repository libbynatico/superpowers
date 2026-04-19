import { createClient } from '@/lib/supabase/server'
import { MessageSquare } from 'lucide-react'
import { LibbyAvatar } from '@/components/ui/Avatar'

export default async function LibbyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [profileRes, conversationsRes] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user!.id).single(),
    supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
      .limit(10),
  ])

  const profile = profileRes.data
  const conversations = conversationsRes.data ?? []

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <LibbyAvatar size="lg" />
        <div>
          <h1 className="text-xl font-bold text-stone-900">Libby</h1>
          <p className="text-sm text-stone-500">
            Your persistent workspace assistant
          </p>
        </div>
      </div>

      <div className="bg-violet-50 border border-violet-100 rounded-xl p-5 mb-6">
        <p className="text-sm text-violet-900 leading-relaxed">
          <strong>Libby</strong> is always available in the right panel of your workspace. Use the
          assistant rail to chat, ask questions about your matters, files, or calendar, and get
          context-aware guidance.
        </p>
        <p className="text-xs text-violet-700 mt-2">
          Voice input and spoken replies are available in the assistant panel.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-800">
            Conversation history
          </h2>
        </div>

        {conversations.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-8 text-stone-400">
            <MessageSquare className="w-5 h-5" strokeWidth={1.5} />
            <div>
              <div className="text-sm font-medium">No saved conversations yet</div>
              <div className="text-xs mt-0.5">
                Conversations are saved as you use the assistant rail.
              </div>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {conversations.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="text-sm font-medium text-stone-800">
                  {c.title ?? 'Untitled conversation'}
                </div>
                {c.context_route && (
                  <div className="text-xs text-stone-400 mt-0.5">
                    Context: {c.context_route}
                  </div>
                )}
                <div className="text-xs text-stone-400 mt-0.5">
                  {new Date(c.updated_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
