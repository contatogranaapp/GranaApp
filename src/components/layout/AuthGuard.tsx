'use client'
// src/components/layout/AuthGuard.tsx

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

export function AuthGuard({ children }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'auth' | 'unauth'>('loading')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function check() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            storageKey: 'grana-auth',
            storage: window.localStorage,
          },
        }
      )

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setStatus('unauth')
        router.replace('/login')
        return
      }

      // Busca perfil
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!prof) {
        // Aguarda 1 segundo para dar tempo do onboarding salvar
        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: prof2 } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!prof2) {
          router.replace('/onboarding')
          return
        }

        setProfile(prof2)
        setStatus('auth')
        return
      }

      setProfile(prof)
      setStatus('auth')
    }

    check()
  }, [router])

  // Loading
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0C0C0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid rgba(45,204,143,0.2)',
          borderTop: '3px solid #2DCC8F',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Carregando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === 'unauth') return null

  // Renderiza o app com o Sidebar
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0C0C0F' }}>
      <SidebarWrapper profile={profile} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

// Import dinâmico do Sidebar para evitar problemas de SSR
function SidebarWrapper({ profile }: { profile: any }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Sidebar } = require('@/components/layout/Sidebar')
  return <Sidebar profile={profile} />
}
