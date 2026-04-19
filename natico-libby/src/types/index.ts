export interface Profile {
  id: string
  user_code: string
  display_name: string
  role: 'admin' | 'user'
  avatar_url?: string | null
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  spoken_replies: boolean
  theme: string
  openrouter_api_key?: string | null
  openrouter_model: string
  created_at: string
}

export interface Connector {
  id: string
  user_id: string
  provider: 'google_calendar' | 'github'
  status: 'connected' | 'disconnected' | 'error'
  access_token?: string | null
  refresh_token?: string | null
  token_expiry?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Matter {
  id: string
  user_id: string
  title: string
  description?: string | null
  status: 'open' | 'closed' | 'archived'
  created_at: string
  updated_at: string
}

export interface FileRecord {
  id: string
  user_id: string
  matter_id?: string | null
  name: string
  size?: number | null
  mime_type?: string | null
  storage_path: string
  created_at: string
}

export interface Alert {
  id: string
  user_id: string
  title: string
  message?: string | null
  severity: 'info' | 'warning' | 'error'
  read: boolean
  created_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  connector_id: string
  external_id?: string | null
  title: string
  start_time?: string | null
  end_time?: string | null
  description?: string | null
  location?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title?: string | null
  context_route?: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface WorkspaceContext {
  route: string
  profile: Profile | null
  mattersCount: number
  filesCount: number
  unreadAlertsCount: number
  connectors: Connector[]
  upcomingEventsCount: number
}

export interface LibbyMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
