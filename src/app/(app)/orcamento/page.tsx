'use client'
// src/app/(app)/orcamento/page.tsx

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

export default function OrcamentoPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [spending, setSpending] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<any>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')

  async function load() {
    setLoading(true)
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)

    // Categorias de gasto
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('type', 'expense')
      .or('user_id.is.null,user_id.eq.' + session.user.id)
      .order('name')

    // Orçamentos do mês
    const { data: buds } = await supabase
      .from('budgets')
      .select('*, categories(*)')
      .eq('user_id', session.user.id)
      .eq('month', month)
      .eq('year', year)

    // Gastos reais do mês por categoria
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    const { data: txs } = await supabase
      .from('transactions')
      .select('category_id, amount, categories(id, name)')
      .eq('user_id', session.user.id)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate)

    // Mapa de gastos por category_id (UUID do banco)
    const spendMap: Record<string, number> = {}
    ;(txs ?? []).forEach((t: any) => {
      if (t.category_id) spendMap[t.category_id] = (spendMap[t.category_id] ?? 0) + t.amount
    })

    // Também mapear por nome da categoria (para lançamentos via chat com IDs hardcoded)
    // Se o category_id não bater com nenhuma categoria do banco, tenta casar pelo nome
    const catNameToId: Record<string, string> = {}
    ;(cats ?? []).forEach((c: any) => { catNameToId[c.name.toLowerCase()] = c.id })

    const HARDCODED_MAP: Record<string, string> = {
      'cat_alimentacao': 'alimentação', 'cat_transporte': 'transporte',
      'cat_moradia': 'moradia', 'cat_saude': 'saúde', 'cat_lazer': 'lazer',
      'cat_educacao': 'educação', 'cat_assinaturas': 'assinaturas',
      'cat_outros_gast': 'outros',
    }

    ;(txs ?? []).forEach((t: any) => {
      const catId = t.category_id
      if (!catId) return
      // Se o ID não existe nas categorias do banco, tenta mapear pelo nome hardcoded
      const isHardcoded = HARDCODED_MAP[catId]
      if (isHardcoded) {
        const realId = catNameToId[isHardcoded]
        if (realId) {
          spendMap[realId] = (spendMap[realId] ?? 0) + t.amount
          // Remove o lançamento do ID errado para não duplicar
          if (spendMap[catId]) delete spendMap[catId]
        }
      }
    })

    setCategories(cats ?? [])
    setBudgets(buds ?? [])
    setSpending(spendMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [month, year])

  async function saveBudget() {
    if (!editValue || !editModal) return
    setSaving(true)
    const supabase = await getSupabase()

    const existing = budgets.find(b => b.category_id === editModal.id)
    if (existing) {
      await supabase.from('budgets').update({ limit_amount: parseFloat(editValue) }).eq('id', existing.id)
    } else {
      await supabase.from('budgets').insert({
        user_id: userId,
        category_id: editModal.id,
        month, year,
        limit_amount: parseFloat(editValue),
      })
    }
    setEditModal(null)
    setEditValue('')
    setSaving(false)
    load()
  }

  async function removeBudget(categoryId: string) {
    const supabase = await getSupabase()
    const existing = budgets.find(b => b.category_id === categoryId)
    if (existing) {
      await supabase.from('budgets').delete().eq('id', existing.id)
      load()
    }
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit_amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spending[b.category_id] ?? 0), 0)

  const s = {
    page: { minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(12px,3vw,20px) clamp(16px,4vw,32px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky' as const, top: 0, backgroundColor: 'rgba(12,12,15,0.9)', backdropFilter: 'blur(12px)', zIndex: 10 },
    card: { backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' } as React.CSSProperties,
    input: { width: '100%', backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: '#F0EFE8', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'DM Sans, system-ui, sans-serif' } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modal: { backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px' } as React.CSSProperties,
  }

  // Merge categorias com budgets
  const catsWithBudget = categories.map(cat => {
    const budget = budgets.find(b => b.category_id === cat.id)
    const spent = spending[cat.id] ?? 0
    const limit = budget?.limit_amount ?? 0
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
    const status = !limit ? 'none' : pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok'
    return { ...cat, budget, spent, limit, pct, status }
  })

  const withBudget = catsWithBudget.filter(c => c.limit > 0)
  const withoutBudget = catsWithBudget.filter(c => c.limit === 0)

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={{ fontSize: '15px', fontWeight: 500, color: '#F0EFE8', margin: 0 }}>Orçamento</h1>
        {/* Seletor de mês */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px', overflowX: 'auto' as const }}>
          {MONTHS.map((m, i) => (
            <button key={m} onClick={() => setMonth(i + 1)} style={{
              padding: '5px 8px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif', whiteSpace: 'nowrap' as const,
              backgroundColor: month === i + 1 ? 'rgba(45,204,143,0.15)' : 'transparent',
              color: month === i + 1 ? '#2DCC8F' : 'rgba(255,255,255,0.35)',
            }}>{m.slice(0, 3)}</button>
          ))}
        </div>
      </header>

      <div style={{ padding: 'clamp(16px,4vw,32px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Resumo */}
        {withBudget.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {[
              { label: 'Orçado', value: fmt(totalBudgeted), color: '#5B8DEF' },
              { label: 'Gasto', value: fmt(totalSpent), color: totalSpent > totalBudgeted ? '#FF5E5E' : '#F5A623' },
              { label: 'Disponível', value: fmt(Math.max(0, totalBudgeted - totalSpent)), color: '#2DCC8F' },
            ].map(item => (
              <div key={item.label} style={{ ...s.card, padding: '16px' }}>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>{item.label}</p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(14px,3vw,18px)', color: item.color, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Categorias com orçamento */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0' }}>Carregando...</div>
        ) : (
          <>
            {withBudget.length > 0 && (
              <div style={s.card}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Categorias com limite</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {withBudget.map(cat => (
                    <div key={cat.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{cat.name}</span>
                        <span style={{ fontSize: '12px', color: cat.status === 'over' ? '#FF5E5E' : cat.status === 'warning' ? '#F5A623' : 'rgba(255,255,255,0.4)' }}>
                          {fmt(cat.spent)} / {fmt(cat.limit)}
                        </span>
                        <button onClick={() => { setEditModal(cat); setEditValue(String(cat.limit)) }}
                          style={{ padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                          editar
                        </button>
                        <button onClick={() => removeBudget(cat.id)}
                          style={{ padding: '4px 8px', backgroundColor: 'rgba(255,94,94,0.08)', border: '1px solid rgba(255,94,94,0.15)', borderRadius: '6px', color: '#FF5E5E', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                          ✕
                        </button>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '999px', transition: 'width 0.5s ease',
                          width: `${cat.pct}%`,
                          backgroundColor: cat.status === 'over' ? '#FF5E5E' : cat.status === 'warning' ? '#F5A623' : cat.color,
                        }} />
                      </div>
                      {cat.status === 'over' && (
                        <p style={{ fontSize: '11px', color: '#FF5E5E', marginTop: '4px' }}>⚠️ Limite ultrapassado em {fmt(cat.spent - cat.limit)}</p>
                      )}
                      {cat.status === 'warning' && (
                        <p style={{ fontSize: '11px', color: '#F5A623', marginTop: '4px' }}>⚡ {cat.pct.toFixed(0)}% do limite usado</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorias sem orçamento */}
            <div style={s.card}>
              <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                {withBudget.length === 0 ? 'Defina limites por categoria' : 'Categorias sem limite'}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '16px' }}>
                Clique em "+ limite" para definir quanto quer gastar
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {withoutBudget.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                    <span style={{ flex: 1, fontSize: '13px' }}>{cat.name}</span>
                    {cat.spent > 0 && (
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{fmt(cat.spent)} gasto</span>
                    )}
                    <button onClick={() => { setEditModal(cat); setEditValue('') }}
                      style={{ padding: '6px 12px', backgroundColor: 'rgba(45,204,143,0.08)', border: '1px solid rgba(45,204,143,0.2)', borderRadius: '8px', color: '#2DCC8F', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                      + limite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal editar limite */}
      {editModal && (
        <div style={s.overlay} onClick={() => setEditModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '28px' }}>{editModal.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>{editModal.name}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Limite para {MONTHS[month - 1]}</p>
              </div>
            </div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>
              Limite mensal (R$)
            </label>
            <input style={s.input} type="number" placeholder="Ex: 800" autoFocus value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveBudget()} />
            {editModal.spent > 0 && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '8px' }}>
                Já gasto este mês: {fmt(editModal.spent)}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: '12px', backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                Cancelar
              </button>
              <button onClick={saveBudget} disabled={saving || !editValue}
                style={{ flex: 2, padding: '12px', backgroundColor: saving || !editValue ? 'rgba(45,204,143,0.3)' : '#2DCC8F', border: 'none', borderRadius: '10px', color: '#0C0C0F', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                {saving ? 'Salvando...' : 'Salvar Limite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
