'use client'
// src/app/(auth)/onboarding/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GOALS_OPTIONS = [
  '✈️ Viagem', '🛡️ Reserva de emergência', '🏠 Casa própria',
  '📱 Eletrônico', '🎓 Educação', '🚗 Carro', '💰 Investir', '🧾 Quitar dívidas',
]

const BANKS = [
  { id: 'nubank',   icon: '💜', name: 'Nubank' },
  { id: 'itau',     icon: '🟠', name: 'Itaú' },
  { id: 'bradesco', icon: '🔴', name: 'Bradesco' },
  { id: 'bb',       icon: '🟡', name: 'Banco do Brasil' },
  { id: 'caixa',    icon: '🔵', name: 'Caixa' },
  { id: 'inter',    icon: '🟠', name: 'Inter' },
  { id: 'carteira', icon: '👛', name: 'Carteira (dinheiro)' },
]

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
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
}

export default function OnboardingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    monthly_income: 3000,
    goals: [] as string[],
    banks: ['nubank'] as string[],
  })

  useEffect(() => { setMounted(true) }, [])

  function toggleGoal(g: string) {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g],
    }))
  }

  function toggleBank(id: string) {
    setForm(f => ({
      ...f,
      banks: f.banks.includes(id) ? f.banks.filter(x => x !== id) : [...f.banks, id],
    }))
  }

  async function finish() {
    setLoading(true)
    try {
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
      if (!session) { router.replace('/login'); return }

      const userName = form.name.trim() ||
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split('@')[0] ||
        'Usuário'

      // Salvar perfil — logar erro se falhar
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          name: userName,
          email: session.user.email!,
          monthly_income: form.monthly_income,
          plan: 'free',
          currency: 'BRL',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Erro ao salvar perfil:', profileError)
        alert(`Erro ao salvar perfil: ${profileError.message}\n\nVerifique as políticas RLS no Supabase.`)
        setLoading(false)
        return
      }

      // Criar contas bancárias selecionadas
      if (form.banks.length > 0) {
        const bankColors: Record<string, string> = {
          nubank: '#8A2BE2', itau: '#FF6600', bradesco: '#CC0000',
          bb: '#FFCC00', caixa: '#0066CC', inter: '#FF6B00', carteira: '#2DCC8F',
        }
        const BANKS_MAP: Record<string, { icon: string; name: string }> = {
          nubank:   { icon: '💜', name: 'Nubank' },
          itau:     { icon: '🟠', name: 'Itaú' },
          bradesco: { icon: '🔴', name: 'Bradesco' },
          bb:       { icon: '🟡', name: 'Banco do Brasil' },
          caixa:    { icon: '🔵', name: 'Caixa' },
          inter:    { icon: '🟠', name: 'Inter' },
          carteira: { icon: '👛', name: 'Carteira' },
        }
        await supabase.from('accounts').insert(
          form.banks.map(id => ({
            user_id: session.user.id,
            name: BANKS_MAP[id]?.name ?? id,
            type: id === 'carteira' ? 'cash' : 'checking',
            icon: BANKS_MAP[id]?.icon ?? '🏦',
            color: bankColors[id] ?? '#888',
            balance: 0,
            is_active: true,
          }))
        )
      }

      router.replace('/dashboard')
    } catch (err) {
      console.error('Erro inesperado no onboarding:', err)
      alert('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Estilos base ──
  const s = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#0C0C0F',
      color: '#F0EFE8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    } as React.CSSProperties,
    card: {
      width: '100%',
      maxWidth: '440px',
      backgroundColor: '#141418',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      padding: '32px',
    } as React.CSSProperties,
    input: {
      width: '100%',
      backgroundColor: '#1C1C22',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '14px',
      color: '#F0EFE8',
      outline: 'none',
      boxSizing: 'border-box' as const,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    } as React.CSSProperties,
    btnPrimary: {
      width: '100%',
      backgroundColor: loading ? 'rgba(45,204,143,0.4)' : '#2DCC8F',
      color: '#0C0C0F',
      border: 'none',
      borderRadius: '12px',
      padding: '14px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      fontFamily: 'DM Sans, system-ui, sans-serif',
      marginTop: '24px',
    } as React.CSSProperties,
    label: {
      fontSize: '11px',
      fontWeight: 600,
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      display: 'block',
      marginBottom: '8px',
    } as React.CSSProperties,
  }

  if (!mounted) {
    return (
      <div style={{ ...s.page }}>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>Carregando...</div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{
            width: '34px', height: '34px', backgroundColor: '#2DCC8F',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 900, fontSize: '16px', color: '#0C0C0F',
          }}>G</div>
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '20px' }}>Grana</span>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                backgroundColor: i <= step ? '#2DCC8F' : 'rgba(255,255,255,0.06)',
                color: i <= step ? '#0C0C0F' : 'rgba(255,255,255,0.25)',
                boxShadow: i === step ? '0 0 0 4px rgba(45,204,143,0.2)' : 'none',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < 3 && (
                <div style={{
                  width: '40px', height: '2px',
                  backgroundColor: i < step ? 'rgba(45,204,143,0.4)' : 'rgba(255,255,255,0.06)',
                }} />
              )}
            </div>
          ))}
        </div>

        <div style={s.card}>

          {/* ── STEP 0: Nome ── */}
          {step === 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#2DCC8F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Passo 1 de 4
              </p>
              <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '26px', marginBottom: '4px' }}>
                Oi! Como posso te chamar? 👋
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>
                Vamos personalizar sua experiência.
              </p>
              <label style={s.label}>Seu nome</label>
              <input
                style={s.input}
                placeholder="Ex: Marina, João..."
                autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && form.name.trim().length >= 2 && setStep(1)}
              />
              <button
                style={{ ...s.btnPrimary, backgroundColor: form.name.trim().length < 2 ? 'rgba(45,204,143,0.3)' : '#2DCC8F' }}
                disabled={form.name.trim().length < 2}
                onClick={() => setStep(1)}
              >
                Continuar →
              </button>
            </div>
          )}

          {/* ── STEP 1: Renda ── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#2DCC8F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Passo 2 de 4
              </p>
              <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '26px', marginBottom: '4px' }}>
                Qual sua renda mensal? 💰
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>
                Pode ser aproximado. Usamos para calcular metas.
              </p>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '36px', color: '#2DCC8F', marginBottom: '12px' }}>
                R$ {form.monthly_income.toLocaleString('pt-BR')}
              </div>
              <input
                type="range" min="500" max="30000" step="500"
                value={form.monthly_income}
                onChange={e => setForm(f => ({ ...f, monthly_income: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#2DCC8F', marginBottom: '16px' }}
              />
              <label style={s.label}>Ou digite o valor</label>
              <input
                style={s.input}
                type="number"
                value={form.monthly_income}
                onChange={e => setForm(f => ({ ...f, monthly_income: Number(e.target.value) || 0 }))}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                <button onClick={() => setStep(0)} style={{ ...s.btnPrimary, backgroundColor: '#1C1C22', color: 'rgba(255,255,255,0.5)', marginTop: 0, flex: 1 }}>
                  ← Voltar
                </button>
                <button onClick={() => setStep(2)} style={{ ...s.btnPrimary, marginTop: 0, flex: 2 }}>
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Objetivos ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#2DCC8F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Passo 3 de 4
              </p>
              <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '26px', marginBottom: '4px' }}>
                Quais são seus objetivos? 🎯
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px' }}>
                Pode marcar vários. É opcional.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {GOALS_OPTIONS.map(g => (
                  <button key={g} onClick={() => toggleGoal(g)} style={{
                    padding: '8px 14px', borderRadius: '999px', fontSize: '13px', cursor: 'pointer',
                    border: form.goals.includes(g) ? '1px solid rgba(45,204,143,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    backgroundColor: form.goals.includes(g) ? 'rgba(45,204,143,0.1)' : 'rgba(255,255,255,0.03)',
                    color: form.goals.includes(g) ? '#2DCC8F' : 'rgba(255,255,255,0.45)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                  }}>
                    {g}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                <button onClick={() => setStep(1)} style={{ ...s.btnPrimary, backgroundColor: '#1C1C22', color: 'rgba(255,255,255,0.5)', marginTop: 0, flex: 1 }}>
                  ← Voltar
                </button>
                <button onClick={() => setStep(3)} style={{ ...s.btnPrimary, marginTop: 0, flex: 2 }}>
                  Continuar →
                </button>
              </div>
              <p onClick={() => setStep(3)} style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '12px', cursor: 'pointer' }}>
                Pular, definir depois
              </p>
            </div>
          )}

          {/* ── STEP 3: Contas ── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#2DCC8F', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Passo 4 de 4
              </p>
              <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '26px', marginBottom: '4px' }}>
                Quais contas você usa? 🏦
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px' }}>
                Pode adicionar mais depois.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {BANKS.map(bank => (
                  <button key={bank.id} onClick={() => toggleBank(bank.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    border: form.banks.includes(bank.id) ? '1px solid rgba(45,204,143,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: form.banks.includes(bank.id) ? 'rgba(45,204,143,0.06)' : 'rgba(255,255,255,0.02)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                  }}>
                    <span style={{ fontSize: '20px' }}>{bank.icon}</span>
                    <span style={{ flex: 1, fontSize: '14px', color: '#F0EFE8' }}>{bank.name}</span>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                      backgroundColor: form.banks.includes(bank.id) ? '#2DCC8F' : 'transparent',
                      border: form.banks.includes(bank.id) ? '2px solid #2DCC8F' : '2px solid rgba(255,255,255,0.2)',
                      color: '#0C0C0F',
                    }}>
                      {form.banks.includes(bank.id) ? '✓' : ''}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                <button onClick={() => setStep(2)} style={{ ...s.btnPrimary, backgroundColor: '#1C1C22', color: 'rgba(255,255,255,0.5)', marginTop: 0, flex: 1 }}>
                  ← Voltar
                </button>
                <button
                  onClick={finish}
                  disabled={loading || form.banks.length === 0}
                  style={{ ...s.btnPrimary, marginTop: 0, flex: 2, backgroundColor: loading || form.banks.length === 0 ? 'rgba(45,204,143,0.3)' : '#2DCC8F' }}
                >
                  {loading ? 'Salvando...' : 'Entrar no Grana ✓'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
