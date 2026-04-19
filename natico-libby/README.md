# NATICO / Libby Live

A working authenticated workspace demo built with Next.js App Router, Supabase, and Tailwind CSS.

## What This Is

- A public NATICO site (`/`, `/about`, `/services`, `/resources`)
- Authenticated workspace with a **3-column shell** (nav rail + content + Libby assistant rail)
- Two canonical seeded users: `#000` (admin) and `#001` (primary working account)
- Real file upload via Supabase Storage
- Live Google Calendar connector (OAuth 2.0, read-only)
- Live GitHub connector (OAuth or Personal Access Token, read-only)
- Persistent Libby assistant with text input, voice input (Web Speech API), and spoken replies
- All empty states are truthful — no mock data

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Storage | Supabase Storage |
| State | Zustand (optional, not yet wired) |

## Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase project (or local Supabase instance)

## Setup

### 1. Clone and install

```bash
cd natico-libby
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `GITHUB_CLIENT_ID` | [GitHub Settings](https://github.com/settings/applications/new) → Developer settings → OAuth Apps |
| `GITHUB_CLIENT_SECRET` | Same as above |

### 3. Set up the database

**Using local Supabase (recommended for dev):**

```bash
supabase start
supabase db reset          # applies all migrations including seed
```

**Using a hosted Supabase project:**

```bash
supabase db push
```

Then manually run `supabase/migrations/002_seed.sql` in the Supabase SQL editor to create the two seeded users. The seed inserts `auth.users` rows directly — this only works on local Supabase. For hosted, use the Supabase admin API or create the users manually in the Authentication dashboard.

### 4. Configure OAuth redirect URIs

**Google:**
- Authorized redirect URI: `http://localhost:3000/api/connectors/google-calendar/callback`
- Scopes: `calendar.readonly`, `userinfo.email`

**GitHub:**
- Authorization callback URL: `http://localhost:3000/api/connectors/github/callback`
- For Personal Access Token: no callback needed — enter token directly in the Connectors page

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Seeded Users

| Code | Email | Password | Role |
|------|-------|----------|------|
| `#000` | libbynatico@gmail.com | `libby-system-000` | admin |
| `#001` | mattherbert01@gmail.com | `libby-natico-001` | user |

**Important:** Change these passwords before any public deployment.

User `#000` (Libby System) is an internal/root account. Use `#001` (Libby Natico) for regular daily use.

## Routes

### Public
- `/` — Home
- `/about` — About NATICO
- `/services` — Feature overview
- `/resources` — Setup docs
- `/login` — Sign in
- `/register` — Create account

### Authenticated (require login)
- `/dashboard` — Workspace overview
- `/matters` — Matter list
- `/matters/[id]` — Matter detail
- `/files` — File upload and management
- `/alerts` — Notifications
- `/calendar` — Google Calendar events
- `/connectors` — Manage integrations
- `/libby` — Conversation history
- `/settings` — Profile and preferences
- `/admin` — Admin view (user #000 only)

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/callback` | GET | Supabase OAuth callback |
| `/api/files` | POST | Upload file |
| `/api/files?id=` | DELETE | Delete file |
| `/api/libby` | POST | Assistant message endpoint |
| `/api/connectors/google-calendar` | GET | Initiate Google OAuth or disconnect |
| `/api/connectors/google-calendar/callback` | GET | Google OAuth callback |
| `/api/connectors/google-calendar/events` | GET | Fetch upcoming events |
| `/api/connectors/github` | GET | Initiate GitHub OAuth or disconnect |
| `/api/connectors/github` | POST | Save GitHub Personal Access Token |
| `/api/connectors/github/callback` | GET | GitHub OAuth callback |
| `/api/connectors/github/repos` | GET | Fetch repositories |

## Libby Assistant

The assistant (`/api/libby`) uses context from the current route and workspace to respond. It runs in two modes:

1. **With `ANTHROPIC_API_KEY`**: Uses Claude Haiku for intelligent responses
2. **Without API key**: Uses a rule-based context-aware system — still honest and helpful

Voice features use the **Web Speech API** (browser built-in — no server or API key needed):
- Microphone button → transcript inserted into composer → edit before send
- Speaker button → enable/disable spoken replies via `speechSynthesis`

## Storage

Files are stored in Supabase Storage under the `user-files` bucket. Row-level security ensures users can only access their own files. Storage path format: `{user_id}/{timestamp}-{filename}`.

## Design

- Deep purple accent (`violet-700`)
- Warm neutral surfaces (`stone-50`, `stone-100`)
- Clean Inter sans-serif typography
- Libby: SVG cartoon wizard-librarian (inline, no external asset dependency)

## Incomplete / Future Work

The following items are partially implemented or not yet wired:

- [ ] Google Calendar token refresh (tokens expire after 1 hour; reconnect required)
- [ ] Supabase Realtime for live alert push
- [ ] Conversation persistence in Libby rail (messages stored in session only)
- [ ] Mobile responsive nav drawer
- [ ] File preview / download
- [ ] Matter status editing
- [ ] Full Zustand client state

These are labeled as such in the UI rather than silently broken.

## License

This demo is provided as-is for connector testing and development.
