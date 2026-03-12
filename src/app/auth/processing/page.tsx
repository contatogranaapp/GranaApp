'use client'
// src/app/auth/processing/page.tsx
// Captura o access_token do fragmento # (Implicit flow) e finaliza o login
// Separado de /auth/callback para não conflitar com route.ts

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthProcessingPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Finalizando login...')

  useEffect(() => {
    async function handleCallback() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Pega sessão atual (Supabase detecta automaticamente o fragmento #)
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setStatus('Login realizado! Redirecionando...')
        router.replace('/dashboard')
        return
      }

      // Tenta via código na URL (?code=)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!exchangeError) {
          router.replace('/dashboard')
          return
        }
      }

      // Última tentativa — escuta mudança de estado de auth
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session) {
            subscription.unsubscribe()
            router.replace('/dashboard')
          }
        }
      )

      // Timeout de segurança
      setTimeout(() => {
        subscription.unsubscribe()
        setStatus('Erro ao autenticar. Redirecionando...')
        router.replace('/login?error=timeout')
      }, 5000)
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0C0C0F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      {/* Logo */}
      <div style={{
        width: '48px', height: '48px',
        backgroundColor: '#2DCC8F',
        borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontWeight: 900, fontSize: '22px', color: '#0C0C0F',
        marginBottom: '8px',
      }}>G</div>

      {/* Spinner */}
      <div style={{
        width: '32px', height: '32px',
        border: '3px solid rgba(45,204,143,0.2)',
        borderTop: '3px solid #2DCC8F',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
        {status}
      </p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
