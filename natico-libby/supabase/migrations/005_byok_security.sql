-- BYOK security hardening notes
-- ============================================================
-- CURRENT STATE: openrouter_api_key is stored as plaintext text in user_preferences.
-- RLS ensures each user can only read their own row.
-- The API route reads the key server-side only — the client settings page
-- must NOT select this column (see settings/page.tsx).
--
-- TODO (future hardening): encrypt at rest using one of:
--   (a) Supabase Vault: https://supabase.com/docs/guides/database/vault
--       SELECT vault.create_secret('sk-or-...', 'openrouter_key_user_001');
--   (b) pgcrypto column-level encryption with a per-user key derived from
--       a server-side secret + user_id.
--
-- For now, isolate key access behind the server-only API route and
-- never expose it through client-facing queries.
-- ============================================================

-- Create a server-side RPC that returns ONLY whether the key exists (boolean),
-- not the key value. Safe to call from client if needed.
CREATE OR REPLACE FUNCTION public.has_openrouter_key()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_preferences
    WHERE user_id = auth.uid()
      AND openrouter_api_key IS NOT NULL
      AND openrouter_api_key <> ''
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_openrouter_key() TO authenticated;
