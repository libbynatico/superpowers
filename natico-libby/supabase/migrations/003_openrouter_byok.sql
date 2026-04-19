-- Add OpenRouter BYOK key and preferred model to user_preferences
alter table public.user_preferences
  add column if not exists openrouter_api_key text,
  add column if not exists openrouter_model text not null default 'openai/gpt-4o-mini';
