'use client'
// src/app/(app)/planejamento/page.tsx

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

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function PlanejamentoPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const [categories, setCategories] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [spending, setSpending] = useState<Record<string, number>>({})
  const [income, setIncome] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)

    const startDate = `${year}-${String(month).padStart(2,'0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const [catsRes, budsRes, txRes, profileRes] = await Promise.all([
      supabase.from('categories').select('*').eq('type', 'expense').or('user_id.is.null,user_id.eq.' + session.user.id).order('name'),
      supabase.from('budgets').select('*').eq('user_id', session.user.id).eq('month', month).eq('year', year),
      supabase.from('transactions').select('category_id, amount, type').eq('user_id', session.user.id).gte('date', startDate).lte('date', endDate),
      supabase.from('profiles').select('monthly_income').eq('id', session.user.id).single(),
    ])

    const spendMap: Record<string, number> = {}
    let totalIncome = profileRes.data?.monthly_income ?? 0

    ;(txRes.data ?? []).forEach((t: any) => {
      if (t.type === 'expense' && t.category_id) spendMap[t.category_id] = (spendMap[t.category_id] ?? 0) + t.amount
      if (t.type === 'income') totalIncome = Math.max(totalIncome, (txRes.data ?? []).filter((x: any) => x.type === 'income').reduce((s: number, x: any) => s + x.amount, 0))
    })

    setCategories(catsRes.data ?? [])
    setBudgets(budsRes.data ?? [])
    setSpending(spendMap)
    setIncome(totalIncome)
    setLoading(false)
  }

  useEffect(() => { load() }, [month, year])

  async function saveBudget(categoryId: string, value: string) {
    if (!value || parseFloat(value) <= 0) return
    setSaving(true)
    const supabase = await getSupabase()
    await supabase.from('budgets').upsert({
      user_id: userId, category_id: categoryId,
      month, year, limit_amount: parseFloat(value),
    }, { onConflict: 'user_id,category_id,month,year' })
    setEditingId(null)
    setEditVal('')
    setSaving(false)
    load()
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit_amount, 0)
  const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0)
  const remaining = income - totalBudgeted
  const remainingActual = income - totalSpent

  // Distribuição automática (regra 50/30/20)
  async function autoDistribute() {
    if (!income) return
    const supabase = await getSupabase()
    // Categorias fixas: 50% necessidades, 30% desejos, 20% poupança
    const necessidades = ['Moradia','Alimentação','Transporte','Saúde']
    const desejos = ['Lazer','Roupas','Educação','Assinaturas']

    const cats = categories
    const necessidadesCats = cats.filter(c => necessidades.includes(c.name))
    const desejosCats = cats.filter(c => desejos.includes(c.name))

    const budgetsToUpsert = [
      ...necessidadesCats.map(c => ({ user_id: userId, category_id: c.id, month, year, limit_amount: Math.round((income * 0.5) / necessidadesCats.length) })),
      ...desejosCats.map(c => ({ user_id: userId, category_id: c.id, month, year, limit_amount: Math.round((income * 0.3) / desejosCats.length) })),
    ]

    for (const b of budgetsToUpsert) {
      await supabase.from('budgets').upsert(b, { onConflict: 'user_id,category_id,month,year' })
    }
    load()
  }

  const catsWithData = categories.map(cat => {
    const budget = budgets.find(b => b.category_id === cat.id)
    const spent = spending[cat.id] ?? 0
    const limit = budget?.limit_amount ?? 0
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
    const status = !limit ? 'none' : pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok'
    return { ...cat, budget, spent, limit, pct, status }
  })

  const s = {
    page: { minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(12px,3vw,20px) clamp(16px,4vw,32px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky' as const, top: 0, backgroundColor: 'rgba(12,12,15,0.9)', backdropFilter: 'blur(12px)', zIndex: 10, flexWrap: 'wrap' as const, gap: '8px' },
    card: { backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' } as React.CSSProperties,
    input: { backgroundColor: '#1C1C22', border: '1px solid rgba(45,204,143,0.4)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: '#F0EFE8', outline: 'none', width: '110px', fontFamily: 'DM Sans, system-ui, sans-serif', textAlign: 'right' as const } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 500, color: '#F0EFE8', margin: 0 }}>Planejamento Mensal</h1>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Defina quanto quer gastar antes do mês começar</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', gap: '2px', backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px', overflowX: 'auto' as const }}>
            {MONTHS.map((m, i) => (
              <button key={m} onClick={() => setMonth(i + 1)} style={{
                padding: '5px 8px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap' as const,
                backgroundColor: month === i + 1 ? 'rgba(45,204,143,0.15)' : 'transparent',
                color: month === i + 1 ? '#2DCC8F' : 'rgba(255,255,255,0.35)',
              }}>{m.slice(0,3)}</button>
            ))}
          </div>
          {income > 0 && (
            <button onClick={autoDistribute}
              style={{ padding: '8px 14px', backgroundColor: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: '10px', color: '#F5A623', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', flexShrink: 0 }}>
              ✨ Auto 50/30/20
            </button>
          )}
        </div>
      </header>

      <div style={{ padding: 'clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Resumo da renda */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr) repeat(2,1fr)', gap: '12px' }}>
          {[
            { label: 'Renda', value: fmt(income), color: '#2DCC8F', sub: 'estimada' },
            { label: 'Planejado', value: fmt(totalBudgeted), color: '#5B8DEF', sub: 'orçado' },
            { label: 'A distribuir', value: fmt(Math.max(0, remaining)), color: remaining < 0 ? '#FF5E5E' : '#F5A623', sub: remaining < 0 ? 'ultrapassou' : 'disponível' },
            { label: 'Gasto real', value: fmt(totalSpent), color: totalSpent > income ? '#FF5E5E' : 'rgba(255,255,255,0.6)', sub: 'executado' },
          ].map(item => (
            <div key={item.label} style={{ ...s.card, padding: '14px' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</p>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(13px,3vw,18px)', color: item.color, margin: 0 }}>{item.value}</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Barra geral */}
        {income > 0 && totalBudgeted > 0 && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Distribuição do orçamento</span>
              <span style={{ fontSize: '12px', color: totalBudgeted > income ? '#FF5E5E' : '#2DCC8F' }}>
                {((totalBudgeted / income) * 100).toFixed(0)}% da renda
              </span>
            </div>
            <div style={{ height: '12px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (totalBudgeted / income) * 100)}%`, backgroundColor: totalBudgeted > income ? '#FF5E5E' : '#2DCC8F', borderRadius: '999px', transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Planejado: {fmt(totalBudgeted)}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Renda: {fmt(income)}</span>
            </div>
          </div>
        )}

        {/* Dica 50/30/20 */}
        {income > 0 && totalBudgeted === 0 && (
          <div style={{ ...s.card, border: '1px solid rgba(245,166,35,0.2)', backgroundColor: 'rgba(245,166,35,0.05)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '24px' }}>💡</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '8px', color: '#F5A623' }}>Regra dos 50/30/20</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
                  Uma forma simples de distribuir sua renda de {fmt(income)}:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  {[
                    { label: '50% Necessidades', value: fmt(income * 0.5), color: '#5B8DEF' },
                    { label: '30% Desejos', value: fmt(income * 0.3), color: '#A78BFA' },
                    { label: '20% Poupança', value: fmt(income * 0.2), color: '#2DCC8F' },
                  ].map(item => (
                    <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 14px' }}>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '16px', fontFamily: 'Georgia, serif', color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={autoDistribute}
                  style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#F5A623', border: 'none', borderRadius: '10px', color: '#0C0C0F', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', fontSize: '13px' }}>
                  ✨ Aplicar automaticamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categorias */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px' }}>Carregando...</div>
        ) : (
          <div style={s.card}>
            <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Distribuição por Categoria</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {catsWithData.map(cat => (
                <div key={cat.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: cat.limit > 0 ? '6px' : '0' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{cat.icon}</span>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{cat.name}</span>

                    {/* Gasto real */}
                    {cat.spent > 0 && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                        gasto: {fmt(cat.spent)}
                      </span>
                    )}

                    {/* Edição inline */}
                    {editingId === cat.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          autoFocus
                          type="number"
                          placeholder="0"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveBudget(cat.id, editVal); if (e.key === 'Escape') setEditingId(null) }}
                          style={s.input}
                        />
                        <button onClick={() => saveBudget(cat.id, editVal)} disabled={saving}
                          style={{ padding: '6px 10px', backgroundColor: '#2DCC8F', border: 'none', borderRadius: '8px', color: '#0C0C0F', fontWeight: 700, cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                          ✓
                        </button>
                        <button onClick={() => setEditingId(null)}
                          style={{ padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(cat.id); setEditVal(cat.limit > 0 ? String(cat.limit) : '') }}
                        style={{ padding: '6px 12px', backgroundColor: cat.limit > 0 ? 'rgba(255,255,255,0.04)' : 'rgba(45,204,143,0.08)', border: `1px solid ${cat.limit > 0 ? 'rgba(255,255,255,0.07)' : 'rgba(45,204,143,0.2)'}`, borderRadius: '8px', color: cat.limit > 0 ? 'rgba(255,255,255,0.5)' : '#2DCC8F', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', flexShrink: 0, minWidth: '80px', textAlign: 'right' as const }}>
                        {cat.limit > 0 ? fmt(cat.limit) : '+ definir'}
                      </button>
                    )}
                  </div>

                  {/* Barra progresso */}
                  {cat.limit > 0 && (
                    <div style={{ marginLeft: '26px' }}>
                      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${cat.pct}%`, backgroundColor: cat.status === 'over' ? '#FF5E5E' : cat.status === 'warning' ? '#F5A623' : cat.color, borderRadius: '999px', transition: 'width 0.4s' }} />
                      </div>
                      {cat.status !== 'none' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                          <span style={{ fontSize: '10px', color: cat.status === 'over' ? '#FF5E5E' : cat.status === 'warning' ? '#F5A623' : 'rgba(255,255,255,0.3)' }}>
                            {cat.status === 'over' ? `⚠️ Ultrapassou ${fmt(cat.spent - cat.limit)}` : `${fmt(cat.spent)} de ${fmt(cat.limit)}`}
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{cat.pct.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
