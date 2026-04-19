import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck, Users } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('user_code')

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-violet-600" />
        <div>
          <h1 className="text-xl font-bold text-stone-900">Admin</h1>
          <p className="text-sm text-stone-500 mt-0.5">Internal system view — user #000 only</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
        This admin view is for user <strong>#000 (Libby System)</strong>. It is not a daily-use
        account. Production admin tooling should be implemented separately.
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
          <Users className="w-4 h-4 text-stone-400" />
          <h2 className="text-sm font-semibold text-stone-800">All users</h2>
        </div>

        {!allProfiles || allProfiles.length === 0 ? (
          <div className="px-4 py-6 text-sm text-stone-400">No profiles found.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {allProfiles.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {p.user_code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800">{p.display_name}</div>
                  <div className="text-xs text-stone-400 truncate">{p.id}</div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    p.role === 'admin'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {p.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
