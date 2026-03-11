import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ── Client Components ('use client') ──────────────────────────
export function createBrowserClient() {
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      storageKey: 'grana-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })
}

// ── Server Components e API Routes ────────────────────────────
// Lê o token do header Authorization (enviado pelo cliente)
export function createServerClient(accessToken?: string) {
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
  })
}

export const createApiClient = createServerClient

// ── Admin ─────────────────────────────────────────────────────
export const supabaseAdmin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
})
