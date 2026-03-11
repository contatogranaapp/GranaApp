'use client'
// src/app/auth/callback/page.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handle() {
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

      // Aguarda o Supabase processar o token da URL automaticamente
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        router.replace('/dashboard')
        return
      }

      // Escuta mudança de estado (fluxo Implicit / PKCE com hash na URL)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          subscription.unsubscribe()
          router.replace('/dashboard')
        }
      })

      // Timeout de segurança
      setTimeout(() => {
        subscription.unsubscribe()
        router.replace('/login')
      }, 5000)
    }

    handle()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0C0C0F',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{
        width: '48px', height: '48px', backgroundColor: '#2DCC8F',
        borderRadius: '14px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'Georgia, serif',
        fontStyle: 'italic', fontWeight: 900, fontSize: '22px', color: '#0C0C0F',
      }}>G</div>
      <div style={{
        width: '28px', height: '28px',
        border: '3px solid rgba(45,204,143,0.2)',
        borderTop: '3px solid #2DCC8F',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Finalizando login...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
