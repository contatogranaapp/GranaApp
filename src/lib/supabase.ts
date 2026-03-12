import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

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
export function createServerClient(accessToken?: string) {
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : {},
  })
}

export const createApiClient = createServerClient

// ── Admin (FUNÇÃO em vez de constante global) ──────────────────
// ⚠️ CORREÇÃO: era uma constante global que executava no build e quebrava o Next.js
// Agora é uma função — só executa quando chamada, nunca no build
export function getSupabaseAdmin() {
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
