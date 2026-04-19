-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Profiles: one row per auth user
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  user_code   text unique not null,        -- '000', '001', etc.
  display_name text not null,
  role        text not null default 'user' check (role in ('admin', 'user')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

create policy "profiles: admin reads all" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- User preferences
create table if not exists public.user_preferences (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid unique not null references public.profiles(id) on delete cascade,
  spoken_replies boolean not null default false,
  theme          text not null default 'light',
  created_at     timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "user_preferences: own row" on public.user_preferences
  for all using (auth.uid() = user_id);

-- Connectors: OAuth tokens per provider per user
create table if not exists public.connectors (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  provider      text not null check (provider in ('google_calendar', 'github')),
  status        text not null default 'disconnected'
                  check (status in ('connected', 'disconnected', 'error')),
  access_token  text,
  refresh_token text,
  token_expiry  timestamptz,
  metadata      jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, provider)
);

alter table public.connectors enable row level security;

create policy "connectors: own rows" on public.connectors
  for all using (auth.uid() = user_id);

-- Matters: work items / case files
create table if not exists public.matters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'open'
                check (status in ('open', 'closed', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.matters enable row level security;

create policy "matters: own rows" on public.matters
  for all using (auth.uid() = user_id);

-- Files: uploaded documents
create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  matter_id    uuid references public.matters(id) on delete set null,
  name         text not null,
  size         bigint,
  mime_type    text,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

alter table public.files enable row level security;

create policy "files: own rows" on public.files
  for all using (auth.uid() = user_id);

-- Alerts
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  message    text,
  severity   text not null default 'info'
               check (severity in ('info', 'warning', 'error')),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.alerts enable row level security;

create policy "alerts: own rows" on public.alerts
  for all using (auth.uid() = user_id);

-- Events: synced from calendar connectors
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  connector_id uuid references public.connectors(id) on delete cascade,
  external_id  text,
  title        text not null,
  start_time   timestamptz,
  end_time     timestamptz,
  description  text,
  location     text,
  metadata     jsonb,
  created_at   timestamptz not null default now(),
  unique(connector_id, external_id)
);

alter table public.events enable row level security;

create policy "events: own rows" on public.events
  for all using (auth.uid() = user_id);

-- Conversations: Libby chat sessions
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text,
  context_route text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "conversations: own rows" on public.conversations
  for all using (auth.uid() = user_id);

-- Messages: individual Libby chat messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages: via conversation" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Function: auto-create profile row after sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, user_code, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_code', 'u' || left(new.id::text, 6)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for user files
insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', false)
on conflict (id) do nothing;

create policy "user-files: own objects" on storage.objects
  for all using (
    bucket_id = 'user-files' and auth.uid()::text = (storage.foldername(name))[1]
  );
