'use client'
// src/app/(app)/recorrentes/page.tsx

import { useEffect, useState } from 'react'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, storageKey: 'grana-auth', storage: window.localStorage } }
  )
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const INTERVALS = [
  { value: 'monthly', label: 'Mensal', icon: '📅' },
  { value: 'yearly', label: 'Anual', icon: '📆' },
  { value: 'weekly', label: 'Semanal', icon: '🗓️' },
]

const COMMON_RECURRING = [
  { name: 'Netflix', icon: '🎬', amount: 44.90, type: 'expense', cat: 'Assinaturas' },
  { name: 'Spotify', icon: '🎵', amount: 21.90, type: 'expense', cat: 'Assinaturas' },
  { name: 'Academia', icon: '🏋️', amount: 100, type: 'expense', cat: 'Saúde' },
  { name: 'Aluguel', icon: '🏠', amount: 1500, type: 'expense', cat: 'Moradia' },
  { name: 'Salário', icon: '💼', amount: 5000, type: 'income', cat: 'Salário' },
]

export default function RecorrentesPage() {
  const [recurrings, setRecurrings] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    description: '', amount: '', type: 'expense',
    interval: 'monthly', category_id: '', start_date: new Date().toISOString().split('T')[0],
  })

  async function load() {
    setLoading(true)
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)

    const [{ data: recs }, { data: cats }] = await Promise.all([
      supabase.from('recurring_transactions').select('*, categories(name,icon,color)').eq('user_id', session.user.id).eq('is_active', true).order('created_at'),
      supabase.from('categories').select('*').or('user_id.is.null,user_id.eq.' + session.user.id).order('name'),
    ])
    setRecurrings(recs ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.description || !form.amount) return
    setSaving(true)
    const supabase = await getSupabase()
    await supabase.from('recurring_transactions').insert({
      user_id: userId,
      description: form.description,
      amount: parseFloat(form.amount),
      type: form.type,
      interval: form.interval,
      category_id: form.category_id || null,
      start_date: form.start_date,
    })
    setForm({ description: '', amount: '', type: 'expense', interval: 'monthly', category_id: '', start_date: new Date().toISOString().split('T')[0] })
    setShowModal(false)
    setSaving(false)
    load()
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = await getSupabase()
    await supabase.from('recurring_transactions').update({ is_active: !active }).eq('id', id)
    load()
  }

  async function deleteRec(id: string) {
    const supabase = await getSupabase()
    await supabase.from('recurring_transactions').delete().eq('id', id)
    load()
  }

  function applyTemplate(tpl: any) {
    const cat = categories.find(c => c.name === tpl.cat)
    setForm(f => ({ ...f, description: tpl.name, amount: String(tpl.amount), type: tpl.type, category_id: cat?.id ?? '' }))
  }

  const totalExpense = recurrings.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const totalIncome = recurrings.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)

  const s = {
    page: { minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(12px,3vw,20px) clamp(16px,4vw,32px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky' as const, top: 0, backgroundColor: 'rgba(12,12,15,0.9)', backdropFilter: 'blur(12px)', zIndex: 10 },
    card: { backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' } as React.CSSProperties,
    input: { width: '100%', backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#F0EFE8', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modal: { backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' as const } as React.CSSProperties,
    label: { display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' } as React.CSSProperties,
    btn: { backgroundColor: '#2DCC8F', color: '#0C0C0F', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={{ fontSize: '15px', fontWeight: 500, color: '#F0EFE8', margin: 0 }}>Recorrentes</h1>
        <button style={s.btn} onClick={() => setShowModal(true)}>+ Nova Recorrente</button>
      </header>

      <div style={{ padding: 'clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Resumo */}
        {recurrings.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {[
              { label: 'Receitas fixas', value: fmt(totalIncome), color: '#2DCC8F' },
              { label: 'Gastos fixos', value: fmt(totalExpense), color: '#FF5E5E' },
              { label: 'Saldo fixo', value: fmt(totalIncome - totalExpense), color: totalIncome >= totalExpense ? '#2DCC8F' : '#FF5E5E' },
            ].map(item => (
              <div key={item.label} style={{ ...s.card, padding: '16px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>{item.label}</p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(13px,2.5vw,18px)', color: item.color, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px' }}>Carregando...</div>
        ) : recurrings.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>Cadastre seus gastos e receitas fixos mensais</p>
            <button style={{ ...s.btn, margin: '0 auto', display: 'block' }} onClick={() => setShowModal(true)}>+ Adicionar recorrente</button>
          </div>
        ) : (
          <>
            {/* Gastos */}
            {recurrings.filter(r => r.type === 'expense').length > 0 && (
              <div style={s.card}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>🔴 Gastos Fixos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recurrings.filter(r => r.type === 'expense').map(rec => (
                    <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', opacity: rec.is_active ? 1 : 0.5 }}>
                      <span style={{ fontSize: '18px' }}>{rec.categories?.icon ?? '📦'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>{rec.description}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                          {INTERVALS.find(i => i.value === rec.interval)?.label} · {rec.categories?.name ?? 'Sem categoria'}
                        </p>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#FF5E5E', flexShrink: 0 }}>{fmt(rec.amount)}</span>
                      <button onClick={() => toggleActive(rec.id, rec.is_active)}
                        style={{ padding: '4px 8px', backgroundColor: rec.is_active ? 'rgba(45,204,143,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${rec.is_active ? 'rgba(45,204,143,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', color: rec.is_active ? '#2DCC8F' : 'rgba(255,255,255,0.3)', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                        {rec.is_active ? 'ativo' : 'pausado'}
                      </button>
                      <button onClick={() => deleteRec(rec.id)}
                        style={{ padding: '4px 8px', backgroundColor: 'rgba(255,94,94,0.08)', border: '1px solid rgba(255,94,94,0.15)', borderRadius: '6px', color: '#FF5E5E', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Receitas */}
            {recurrings.filter(r => r.type === 'income').length > 0 && (
              <div style={s.card}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>💚 Receitas Fixas</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recurrings.filter(r => r.type === 'income').map(rec => (
                    <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '18px' }}>{rec.categories?.icon ?? '💰'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>{rec.description}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{INTERVALS.find(i => i.value === rec.interval)?.label}</p>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#2DCC8F', flexShrink: 0 }}>{fmt(rec.amount)}</span>
                      <button onClick={() => deleteRec(rec.id)}
                        style={{ padding: '4px 8px', backgroundColor: 'rgba(255,94,94,0.08)', border: '1px solid rgba(255,94,94,0.15)', borderRadius: '6px', color: '#FF5E5E', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', marginBottom: '20px' }}>Nova Recorrente</h2>

            {/* Templates rápidos */}
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>Sugestões rápidas</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '20px' }}>
              {COMMON_RECURRING.map(tpl => (
                <button key={tpl.name} onClick={() => applyTemplate(tpl)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '999px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  <span>{tpl.icon}</span> {tpl.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tipo */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['expense', 'income'].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', fontWeight: 600, fontSize: '13px', backgroundColor: form.type === t ? (t === 'expense' ? 'rgba(255,94,94,0.15)' : 'rgba(45,204,143,0.15)') : 'rgba(255,255,255,0.04)', color: form.type === t ? (t === 'expense' ? '#FF5E5E' : '#2DCC8F') : 'rgba(255,255,255,0.4)' }}>
                    {t === 'expense' ? '🔴 Gasto' : '💚 Receita'}
                  </button>
                ))}
              </div>
              <div>
                <label style={s.label}>Descrição</label>
                <input style={s.input} placeholder="Ex: Netflix, Aluguel..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Valor (R$)</label>
                <input style={s.input} type="number" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>Frequência</label>
                  <select style={{ ...s.input, appearance: 'none' as const }} value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}>
                    {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Categoria</label>
                  <select style={{ ...s.input, appearance: 'none' as const }} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">Sem categoria</option>
                    {categories.filter(c => form.type === 'income' ? c.type === 'income' : c.type === 'expense').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={s.label}>Data de início</label>
                <input style={s.input} type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={saving || !form.description || !form.amount}
                  style={{ flex: 2, padding: '12px', backgroundColor: saving || !form.description || !form.amount ? 'rgba(45,204,143,0.3)' : '#2DCC8F', border: 'none', borderRadius: '10px', color: '#0C0C0F', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  {saving ? 'Salvando...' : 'Criar Recorrente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
