// src/app/page.tsx
// Rota raiz — verifica sessão e redireciona

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export default async function RootPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Logado → dashboard
  if (session) redirect('/dashboard')

  // Não logado → landing page
  redirect('/landing')
}
