# NATICO / Libby Live

An authenticated workspace with a persistent AI assistant, real file upload, Google Calendar and GitHub connectors, and voice input/output.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth + DB | Supabase (Postgres, Auth, Storage) |
| AI | OpenRouter — BYOK (user-owned API key) |
| Deployment | Netlify via `@netlify/plugin-nextjs` |

## Canonical users

| Code | Email | Display name | Role |
|------|-------|--------------|------|
| `#000` | libbynatico@gmail.com | Libby System | admin |
| `#001` | mattherbert01@gmail.com | Matthew Herbert | user |

- `#000` is internal/root/admin only. Do not use it for day-to-day work.
- `#001` is the primary working account for live testing and connector setup.
- Passwords are set in `supabase/migrations/002_seed.sql`. Change before any public deployment.
- Public registration creates new user accounts (role: user). It cannot create admin accounts.

## BYOK architecture

Libby uses **Bring Your Own Key** as the primary AI mode.

| Mode | Condition | Behaviour |
|------|-----------|-----------|
| Live (AI) | User has saved an OpenRouter key in Settings | Sends messages to OpenRouter with user's key and selected model |
| Rule-based | No key saved | Deterministic context-aware replies; no external API calls |
| Error/fallback | Key saved but OpenRouter call fails | Shows error message + rule-based guidance |

The server-side `OPENROUTER_API_KEY` env var is **intentionally not used** for user sessions. It is reserved for future admin tooling.

Keys are stored server-side in `user_preferences.openrouter_api_key`. The settings page never reads or displays the key — it only shows a masked presence indicator. See `005_byok_security.sql` for the security TODO on encryption-at-rest.

## Setup

### 1. Install

```bash
cd natico-libby
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in your existing Supabase project credentials and OAuth app details.

### 3. Database

**Local (recommended for dev):**
```bash
supabase start
supabase db reset   # runs all migrations including seed
```

**Hosted Supabase:**
Run migrations `001` through `005` in the SQL editor, or:
```bash
supabase db push
```

Migration 004 corrects the user #001 display name if you ran an earlier seed that had "Libby Natico" instead of "Matthew Herbert".

### 4. OAuth redirect URIs

**Google Calendar:**
- Redirect URI: `$NEXT_PUBLIC_APP_URL/api/connectors/google-calendar/callback`
- Scopes: `calendar.readonly`, `userinfo.email`

**GitHub:**
- Callback URL: `$NEXT_PUBLIC_APP_URL/api/connectors/github/callback`
- Alternatively, users can connect via a Personal Access Token — no OAuth app needed for that path.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in as `#001` (mattherbert01@gmail.com).

### 6. Configure Libby AI (BYOK)

1. Sign in as user `#001`
2. Go to Settings → AI
3. Enter your OpenRouter API key (`sk-or-…`) from [openrouter.ai/keys](https://openrouter.ai/keys)
4. Choose a model (default: `openai/gpt-4o-mini`)
5. Save — Libby switches from rule-based to live AI mode immediately

## Routes

### Public
`/` · `/about` · `/services` · `/resources` · `/login` · `/register`

### Authenticated
`/dashboard` · `/matters` · `/matters/[id]` · `/files` · `/alerts` · `/calendar` · `/connectors` · `/libby` · `/settings` · `/admin` (user #000 only)

## Layout

Desktop authenticated shell: **3 columns**
- Left rail: 240 px — navigation
- Center: flexible — page content
- Right rail: 320 px — persistent Libby assistant

Mobile:
- Left rail hidden; opens as an overlay drawer via hamburger button
- Right rail hidden; opens as a bottom sheet via Libby button in top bar
- Assistant state persists across route changes (mounted once in layout)

## Voice features (Libby assistant rail)

- Microphone input via Web Speech API — transcript inserted into composer for review/edit before send
- Spoken replies via `speechSynthesis` — off by default, toggled per-session
- Replay last reply button (appears after first assistant response)
- Stop speaking button (appears while speaking)
- Clean error state when microphone permission is denied

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/callback` | GET | Supabase OAuth code exchange |
| `/api/libby` | POST | Assistant message (BYOK or rule-based) |
| `/api/libby/status` | GET | Returns `{ mode, hasKey, model }` — no key value |
| `/api/files` | POST | Upload file |
| `/api/files?id=` | DELETE | Delete file |
| `/api/connectors/google-calendar` | GET | Start OAuth or disconnect |
| `/api/connectors/google-calendar/callback` | GET | OAuth callback |
| `/api/connectors/google-calendar/events` | GET | Fetch upcoming events |
| `/api/connectors/github` | GET | Start OAuth or disconnect |
| `/api/connectors/github` | POST | Save Personal Access Token |
| `/api/connectors/github/callback` | GET | OAuth callback |
| `/api/connectors/github/repos` | GET | Fetch repositories |

## Deployment (Netlify)

The `netlify.toml` at the project root configures Next.js deployment via `@netlify/plugin-nextjs`. Set all env vars in the Netlify project dashboard under Site configuration → Environment variables.

## Security notes

- `openrouter_api_key` is stored as plaintext in Supabase. RLS ensures users read only their own row. The client settings page never selects this column.
- Encryption-at-rest via Supabase Vault is a documented TODO in `005_byok_security.sql`.
- The `has_openrouter_key()` Postgres function returns a boolean presence flag only — never the key value.
- OAuth tokens (Google Calendar, GitHub) are stored in the `connectors` table. Apply the same Vault-based encryption when moving to production.

## Known gaps / future work

- [ ] Google Calendar token refresh — tokens expire after 1 hour; user must reconnect
- [ ] Supabase Realtime for live alert push
- [ ] Libby conversation persistence across sessions (currently session-only)
- [ ] Matter status editing
- [ ] Full Zustand client state
- [ ] `openrouter_api_key` encryption at rest (Supabase Vault)
