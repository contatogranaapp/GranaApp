'use client'
// src/app/(app)/metas/page.tsx

import { useEffect, useState } from 'react'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, storageKey: 'grana-auth', storage: window.localStorage } }
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const EMOJI_OPTIONS = ['🎯','✈️','🏠','🚗','📱','🎓','💰','🛡️','🏖️','💎','🎮','👶']

export default function MetasPage() {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [depositModal, setDepositModal] = useState<any>(null)
  const [depositValue, setDepositValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', icon: '🎯', target_amount: '',
    deadline: '', monthly_target: '',
  })

  async function load() {
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('goals').select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
    setGoals(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.title || !form.target_amount) return
    setSaving(true)
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let monthly_target = parseFloat(form.monthly_target) || null
    if (!monthly_target && form.deadline) {
      const months = Math.max(1,
        (new Date(form.deadline).getFullYear() - new Date().getFullYear()) * 12 +
        (new Date(form.deadline).getMonth() - new Date().getMonth())
      )
      monthly_target = parseFloat((parseFloat(form.target_amount) / months).toFixed(2))
    }

    await supabase.from('goals').insert({
      user_id: session.user.id,
      title: form.title,
      icon: form.icon,
      target_amount: parseFloat(form.target_amount),
      current_amount: 0,
      deadline: form.deadline || null,
      monthly_target,
      status: 'active',
    })
    setForm({ title: '', icon: '🎯', target_amount: '', deadline: '', monthly_target: '' })
    setShowModal(false)
    setSaving(false)
    load()
  }

  async function handleDeposit() {
    if (!depositValue || !depositModal) return
    setSaving(true)
    const supabase = await getSupabase()
    const newAmount = depositModal.current_amount + parseFloat(depositValue)
    const completed = newAmount >= depositModal.target_amount
    await supabase.from('goals').update({
      current_amount: newAmount,
      status: completed ? 'completed' : 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', depositModal.id)
    setDepositModal(null)
    setDepositValue('')
    setSaving(false)
    load()
  }

  const COLORS = ['#F5A623','#5B8DEF','#2DCC8F','#A78BFA','#FF5E5E','#20B2AA']
  const active = goals.filter(g => g.status === 'active')
  const completed = goals.filter(g => g.status === 'completed')

  const s = {
    page: { minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)',
      position: 'sticky' as const, top: 0,
      backgroundColor: 'rgba(12,12,15,0.9)', backdropFilter: 'blur(12px)', zIndex: 10,
    },
    btn: {
      display: 'flex', alignItems: 'center', gap: '6px',
      backgroundColor: '#2DCC8F', color: '#0C0C0F',
      border: 'none', borderRadius: '10px', padding: '10px 16px',
      fontSize: '13px', fontWeight: 700, cursor: 'pointer',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    } as React.CSSProperties,
    card: {
      backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px', padding: '20px',
    } as React.CSSProperties,
    input: {
      width: '100%', backgroundColor: '#1C1C22',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px',
      padding: '10px 14px', fontSize: '13px', color: '#F0EFE8',
      outline: 'none', boxSizing: 'border-box' as const,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    } as React.CSSProperties,
    label: {
      display: 'block', fontSize: '11px', fontWeight: 600,
      color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const,
      letterSpacing: '0.05em', marginBottom: '6px',
    } as React.CSSProperties,
    overlay: {
      position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    },
    modal: {
      backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px',
    } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <h1 style={{ fontSize: '15px', fontWeight: 500, color: '#F0EFE8', margin: 0 }}>Metas</h1>
        <button style={s.btn} onClick={() => setShowModal(true)}>+ Nova Meta</button>
      </header>

      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0' }}>Carregando...</div>
        ) : active.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>Nenhuma meta ainda. Crie a primeira!</p>
            <button style={{ ...s.btn, margin: '0 auto' }} onClick={() => setShowModal(true)}>+ Criar meta</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {active.map((goal, i) => {
                const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
                const color = COLORS[i % COLORS.length]
                const remaining = goal.target_amount - goal.current_amount
                return (
                  <div key={goal.id} style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', backgroundColor: `${color}15` }}>
                        {goal.icon}
                      </div>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color }}>{pct}%</span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{goal.title}</p>
                    {goal.monthly_target && (
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>
                        {formatCurrency(goal.monthly_target)}/mês necessário
                      </p>
                    )}
                    {goal.deadline && (
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
                        📅 Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                      <span style={{ color: '#F0EFE8', fontWeight: 600 }}>{formatCurrency(goal.current_amount)}</span>
                      <span>{formatCurrency(goal.target_amount)}</span>
                    </div>
                    <button
                      onClick={() => { setDepositModal(goal); setDepositValue('') }}
                      style={{ width: '100%', padding: '10px', backgroundColor: `${color}15`, border: `1px solid ${color}30`, borderRadius: '10px', color, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}
                    >
                      + Adicionar depósito
                    </button>
                  </div>
                )
              })}
            </div>

            {completed.length > 0 && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  ✅ Concluídas ({completed.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {completed.map(goal => (
                    <div key={goal.id} style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.6 }}>
                      <span style={{ fontSize: '20px' }}>{goal.icon}</span>
                      <span style={{ flex: 1, fontSize: '14px' }}>{goal.title}</span>
                      <span style={{ color: '#2DCC8F', fontSize: '13px', fontWeight: 700 }}>{formatCurrency(goal.target_amount)} ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Nova Meta */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', marginBottom: '20px' }}>Nova Meta</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={s.label}>Ícone</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, icon: e }))}
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: form.icon === e ? '2px solid #2DCC8F' : '1px solid rgba(255,255,255,0.07)', backgroundColor: form.icon === e ? 'rgba(45,204,143,0.1)' : 'transparent', fontSize: '18px', cursor: 'pointer' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={s.label}>Título</label>
                <input style={s.input} placeholder="Ex: Viagem para Europa" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Valor Alvo (R$)</label>
                <input style={s.input} type="number" placeholder="0,00" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>Prazo (opcional)</label>
                  <input style={s.input} type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>Meta Mensal (R$)</label>
                  <input style={s.input} type="number" placeholder="Auto" value={form.monthly_target} onChange={e => setForm(f => ({ ...f, monthly_target: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={saving || !form.title || !form.target_amount}
                  style={{ flex: 2, padding: '12px', backgroundColor: saving || !form.title || !form.target_amount ? 'rgba(45,204,143,0.3)' : '#2DCC8F', border: 'none', borderRadius: '10px', color: '#0C0C0F', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  {saving ? 'Salvando...' : 'Criar Meta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Depósito */}
      {depositModal && (
        <div style={s.overlay} onClick={() => setDepositModal(null)}>
          <div style={{ ...s.modal, maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '20px', marginBottom: '6px' }}>
              {depositModal.icon} {depositModal.title}
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
              {formatCurrency(depositModal.current_amount)} / {formatCurrency(depositModal.target_amount)}
            </p>
            <label style={s.label}>Valor do depósito (R$)</label>
            <input style={s.input} type="number" placeholder="0,00" autoFocus value={depositValue} onChange={e => setDepositValue(e.target.value)} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setDepositModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                Cancelar
              </button>
              <button onClick={handleDeposit} disabled={saving || !depositValue}
                style={{ flex: 2, padding: '12px', backgroundColor: saving || !depositValue ? 'rgba(45,204,143,0.3)' : '#2DCC8F', border: 'none', borderRadius: '10px', color: '#0C0C0F', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                {saving ? 'Salvando...' : 'Confirmar Depósito'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
