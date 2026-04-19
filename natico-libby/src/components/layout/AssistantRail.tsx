import { LibbyChat } from '@/components/assistant/LibbyChat'
import type { WorkspaceContext, Profile } from '@/types'

interface AssistantRailProps {
  context: WorkspaceContext
  profile: Profile | null
}

export function AssistantRail({ context, profile }: AssistantRailProps) {
  return (
    <aside className="flex flex-col h-full bg-white border-l border-stone-200 w-80 flex-shrink-0">
      <LibbyChat context={context} profile={profile} />
    </aside>
  )
}
