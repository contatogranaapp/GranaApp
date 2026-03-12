'use client'
// src/app/(auth)/login/page.tsx
// Login com email/senha + Google OAuth

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'login' | 'register'

const COLORS = {
  bg: '#0C0C0F',
  surface: '#141418',
  surface2: '#1C1C22',
  border: 'rgba(255,255,255,0.07)',
  text: '#F0EFE8',
  muted: 'rgba(240,239,232,0.45)',
  green: '#2DCC8F',
  greenDim: 'rgba(45,204,143,0.1)',
  red: '#FF5E5E',
  redDim: 'rgba(255,94,94,0.1)',
}

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setMounted(true)
    // Se já tiver sessão, redireciona
    async function checkSession() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.replace('/dashboard')
    }
    checkSession()
  }, [router])

  async function getSupabase() {
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const supabase = await getSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const supabase = await getSupabase()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      setError('Erro ao criar conta. Tente outro email.')
      setLoading(false)
    } else {
      setSuccess('Conta criada! Entrando...')
      await supabase.auth.signInWithPassword({ email, password })
      window.location.href = '/onboarding'
    }
  }

  async function handleGoogle() {
    const supabase = await getSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  // Loading state antes do mount (evita tela preta)
  if (!mounted) return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: COLORS.muted, fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>Carregando...</div>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: COLORS.surface2,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    color: COLORS.text,
    outline: 'none',
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: COLORS.muted,
    marginBottom: '8px',
    fontFamily: 'system-ui, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const btnPrimaryStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: COLORS.green,
    color: COLORS.bg,
    fontWeight: 700,
    borderRadius: '12px',
    padding: '13px 20px',
    fontSize: '14px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.5 : 1,
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.01em',
  }

  const btnGhostStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: COLORS.surface2,
    color: COLORS.text,
    fontWeight: 500,
    borderRadius: '12px',
    padding: '13px 20px',
    fontSize: '14px',
    border: `1px solid ${COLORS.border}`,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: active ? 600 : 400,
    color: active ? COLORS.text : COLORS.muted,
    backgroundColor: active ? COLORS.surface2 : 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{
            width: '36px', height: '36px',
            backgroundColor: COLORS.green,
            borderRadius: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontStyle: 'italic', fontWeight: 900, fontSize: '18px', color: COLORS.bg,
            fontFamily: 'Georgia, serif',
          }}>G</div>
          <span style={{ fontStyle: 'italic', fontSize: '22px', color: COLORS.text, fontFamily: 'Georgia, serif' }}>Grana</span>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '20px', padding: '32px' }}>

          {/* Abas */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: COLORS.bg, borderRadius: '12px', padding: '4px', marginBottom: '28px' }}>
            <button style={tabStyle(tab === 'login')} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
              Entrar
            </button>
            <button style={tabStyle(tab === 'register')} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>
              Criar conta
            </button>
          </div>

          {/* Formulário Login */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input style={inputStyle} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Senha</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && (
                <div style={{ fontSize: '13px', color: COLORS.red, backgroundColor: COLORS.redDim, border: `1px solid rgba(255,94,94,0.2)`, borderRadius: '10px', padding: '10px 14px', fontFamily: 'system-ui, sans-serif' }}>
                  {error}
                </div>
              )}
              <button type="submit" style={btnPrimaryStyle} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar →'}
              </button>
            </form>
          )}

          {/* Formulário Cadastro */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input style={inputStyle} type="text" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required autoFocus />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input style={inputStyle} type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Senha</label>
                <input style={inputStyle} type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              {error && (
                <div style={{ fontSize: '13px', color: COLORS.red, backgroundColor: COLORS.redDim, border: `1px solid rgba(255,94,94,0.2)`, borderRadius: '10px', padding: '10px 14px', fontFamily: 'system-ui, sans-serif' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ fontSize: '13px', color: COLORS.green, backgroundColor: COLORS.greenDim, border: `1px solid rgba(45,204,143,0.2)`, borderRadius: '10px', padding: '10px 14px', fontFamily: 'system-ui, sans-serif' }}>
                  {success}
                </div>
              )}
              <button type="submit" style={btnPrimaryStyle} disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar conta →'}
              </button>
            </form>
          )}

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
            <span style={{ fontSize: '12px', color: COLORS.muted, fontFamily: 'system-ui, sans-serif' }}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
          </div>

          {/* Google */}
          <button onClick={handleGoogle} style={btnGhostStyle} type="button">
            {/* Ícone Google SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          {/* Rodapé */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: COLORS.muted, marginTop: '24px', fontFamily: 'system-ui, sans-serif' }}>
            🔒 Seus dados protegidos com criptografia
          </p>
        </div>

        {/* Link voltar */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/landing" style={{ fontSize: '13px', color: COLORS.muted, textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>
            ← Voltar para o início
          </a>
        </div>
      </div>
    </div>
  )
}
