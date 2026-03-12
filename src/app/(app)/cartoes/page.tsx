'use client'
// src/app/(app)/cartoes/page.tsx

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

const CARD_COLORS = ['#818CF8','#F59E0B','#EF4444','#10B981','#3B82F6','#EC4899','#8B5CF6','#F97316']
const CARD_ICONS = ['💳','🏦','💰','⭐','🔵','🟡','🔴','🟢']

export default function CartoesPage() {
  const now = new Date()
  const [cards, setCards] = useState<any[]>([])
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [invoiceMonth, setInvoiceMonth] = useState(now.getMonth() + 1)
  const [invoiceYear] = useState(now.getFullYear())
  const [invoiceTxs, setInvoiceTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    name: '', limit_amount: '', closing_day: '5', due_day: '15',
    color: '#818CF8', icon: '💳',
  })

  async function loadCards() {
    setLoading(true)
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)
    const { data } = await supabase.from('credit_cards').select('*').eq('user_id', session.user.id).eq('is_active', true).order('created_at')
    setCards(data ?? [])
    setLoading(false)
  }

  async function loadInvoice(card: any, month: number, year: number) {
    setLoadingInvoice(true)
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Período da fatura: do dia seguinte ao fechamento do mês anterior até o dia de fechamento
    const closingDay = card.closing_day
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const startDate = `${prevYear}-${String(prevMonth).padStart(2,'0')}-${String(closingDay + 1).padStart(2,'0')}`
    const endDate = `${year}-${String(month).padStart(2,'0')}-${String(closingDay).padStart(2,'0')}`

    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name,icon,color)')
      .eq('user_id', session.user.id)
      .eq('credit_card_id', card.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    setInvoiceTxs(data ?? [])
    setLoadingInvoice(false)
  }

  useEffect(() => { loadCards() }, [])
  useEffect(() => {
    if (selectedCard) loadInvoice(selectedCard, invoiceMonth, invoiceYear)
  }, [selectedCard, invoiceMonth, invoiceYear])

  async function handleCreate() {
    if (!form.name || !form.limit_amount) return
    setSaving(true)
    const supabase = await getSupabase()
    await supabase.from('credit_cards').insert({
      user_id: userId,
      name: form.name,
      limit_amount: parseFloat(form.limit_amount),
      closing_day: parseInt(form.closing_day),
      due_day: parseInt(form.due_day),
      color: form.color,
      icon: form.icon,
    })
    setForm({ name: '', limit_amount: '', closing_day: '5', due_day: '15', color: '#818CF8', icon: '💳' })
    setShowModal(false)
    setSaving(false)
    loadCards()
  }

  async function deleteCard(id: string) {
    const supabase = await getSupabase()
    await supabase.from('credit_cards').update({ is_active: false }).eq('id', id)
    if (selectedCard?.id === id) setSelectedCard(null)
    loadCards()
  }

  const invoiceTotal = invoiceTxs.reduce((s, t) => s + t.amount, 0)
  const usedPercent = selectedCard ? Math.min(100, (invoiceTotal / selectedCard.limit_amount) * 100) : 0

  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  const s = {
    page: { minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(12px,3vw,20px) clamp(16px,4vw,32px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky' as const, top: 0, backgroundColor: 'rgba(12,12,15,0.9)', backdropFilter: 'blur(12px)', zIndex: 10 },
    card: { backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' } as React.CSSProperties,
    input: { width: '100%', backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#F0EFE8', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modal: { backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' as const } as React.CSSProperties,
    label: { display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' } as React.CSSProperties,
    btn: { backgroundColor: '#2DCC8F', color: '#0C0C0F', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={{ fontSize: '15px', fontWeight: 500, color: '#F0EFE8', margin: 0 }}>Cartões de Crédito</h1>
        <button style={s.btn} onClick={() => setShowModal(true)}>+ Novo Cartão</button>
      </header>

      <div style={{ padding: 'clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0' }}>Carregando...</div>
        ) : cards.length === 0 ? (
          <div style={{ ...s.card, textAlign: 'center', padding: '60px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>Nenhum cartão cadastrado ainda.</p>
            <button style={{ ...s.btn, margin: '0 auto', display: 'block' }} onClick={() => setShowModal(true)}>+ Adicionar cartão</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }}>
            {cards.map(card => (
              <div key={card.id}
                onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
                style={{
                  borderRadius: '20px', padding: '24px', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${card.color}CC, ${card.color}66)`,
                  border: selectedCard?.id === card.id ? `2px solid ${card.color}` : '2px solid transparent',
                  position: 'relative' as const, overflow: 'hidden',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: selectedCard?.id === card.id ? `0 8px 32px ${card.color}40` : '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                <div style={{ position: 'absolute' as const, top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute' as const, bottom: '-30px', right: '20px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <span style={{ fontSize: '28px' }}>{card.icon}</span>
                  <button onClick={e => { e.stopPropagation(); deleteCard(card.id) }}
                    style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
                </div>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: 'white', marginBottom: '4px', fontStyle: 'italic' }}>{card.name}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                  Fecha dia {card.closing_day} · Vence dia {card.due_day}
                </p>
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '0%', backgroundColor: 'white', borderRadius: '999px' }} />
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                  Limite: {fmt(card.limit_amount)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Fatura do cartão selecionado */}
        {selectedCard && (
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap' as const, gap: '12px' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>Fatura — {selectedCard.name}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  Vencimento dia {selectedCard.due_day}
                </p>
              </div>
              {/* Seletor de mês da fatura */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1C1C22', borderRadius: '10px', padding: '4px' }}>
                {MONTHS.map((m, i) => (
                  <button key={m} onClick={() => setInvoiceMonth(i + 1)} style={{
                    padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '11px',
                    cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif',
                    backgroundColor: invoiceMonth === i + 1 ? 'rgba(45,204,143,0.15)' : 'transparent',
                    color: invoiceMonth === i + 1 ? '#2DCC8F' : 'rgba(255,255,255,0.35)',
                  }}>{m}</button>
                ))}
              </div>
            </div>

            {/* Total da fatura */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#1C1C22', borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Total Fatura</p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#FF5E5E', margin: 0 }}>{fmt(invoiceTotal)}</p>
              </div>
              <div style={{ backgroundColor: '#1C1C22', borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Limite Usado</p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#F5A623', margin: 0 }}>{usedPercent.toFixed(0)}%</p>
              </div>
              <div style={{ backgroundColor: '#1C1C22', borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Disponível</p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#2DCC8F', margin: 0 }}>{fmt(selectedCard.limit_amount - invoiceTotal)}</p>
              </div>
            </div>

            {/* Barra de uso */}
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ height: '100%', width: `${usedPercent}%`, backgroundColor: usedPercent >= 90 ? '#FF5E5E' : usedPercent >= 70 ? '#F5A623' : '#2DCC8F', borderRadius: '999px', transition: 'width 0.5s' }} />
            </div>

            {/* Transações */}
            {loadingInvoice ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>Carregando fatura...</p>
            ) : invoiceTxs.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhuma compra neste período</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {invoiceTxs.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{tx.categories?.icon ?? '💳'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{tx.description}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {tx.is_installment && ' · Parcelado'}
                      </p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF5E5E', flexShrink: 0 }}>{fmt(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal novo cartão */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', marginBottom: '20px' }}>Novo Cartão</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Ícone */}
              <div>
                <label style={s.label}>Ícone</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {CARD_ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      style={{ width: '40px', height: '40px', borderRadius: '10px', border: form.icon === ic ? '2px solid #2DCC8F' : '1px solid rgba(255,255,255,0.07)', backgroundColor: form.icon === ic ? 'rgba(45,204,143,0.1)' : 'transparent', fontSize: '20px', cursor: 'pointer' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              {/* Cor */}
              <div>
                <label style={s.label}>Cor</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {CARD_COLORS.map(color => (
                    <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, border: form.color === color ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={s.label}>Nome do cartão</label>
                <input style={s.input} placeholder="Ex: Nubank, Itaú Gold..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Limite (R$)</label>
                <input style={s.input} type="number" placeholder="5000" value={form.limit_amount} onChange={e => setForm(f => ({ ...f, limit_amount: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>Dia de fechamento</label>
                  <input style={s.input} type="number" min="1" max="31" placeholder="5" value={form.closing_day} onChange={e => setForm(f => ({ ...f, closing_day: e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>Dia de vencimento</label>
                  <input style={s.input} type="number" min="1" max="31" placeholder="15" value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={saving || !form.name || !form.limit_amount}
                  style={{ flex: 2, padding: '12px', backgroundColor: saving || !form.name || !form.limit_amount ? 'rgba(45,204,143,0.3)' : '#2DCC8F', border: 'none', borderRadius: '10px', color: '#0C0C0F', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                  {saving ? 'Salvando...' : 'Adicionar Cartão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
