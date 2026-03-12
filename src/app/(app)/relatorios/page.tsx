'use client'
// src/app/(app)/relatorios/page.tsx

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getCategoryById } from '@/lib/constants'

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

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function RelatoriosPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = await getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      const { data: goals } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')

      const transactions = txs ?? []
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
      const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0

      // Por categoria
      const byCat = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc: any, t: any) => {
          const cat = getCategoryById(t.category_id)
          const key = cat.id
          if (!acc[key]) acc[key] = { name: cat.name, icon: cat.icon, color: cat.color, total: 0, count: 0 }
          acc[key].total += t.amount
          acc[key].count++
          return acc
        }, {})

      const categories = Object.values(byCat)
        .sort((a: any, b: any) => b.total - a.total)
        .map((c: any) => ({ ...c, percent: totalExpense > 0 ? (c.total / totalExpense) * 100 : 0 }))

      // Por dia
      const byDay = transactions.reduce((acc: any, t: any) => {
        const day = new Date(t.date).getDate()
        if (!acc[day]) acc[day] = { day, expense: 0, income: 0 }
        if (t.type === 'expense') acc[day].expense += t.amount
        else acc[day].income += t.amount
        return acc
      }, {})
      const daysInMonth = new Date(year, month, 0).getDate()
      const byDayArray = Array.from({ length: daysInMonth }, (_, i) => byDay[i + 1] ?? { day: i + 1, expense: 0, income: 0 })

      // Top 5 gastos
      const top5 = [...transactions]
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

      // Score de saúde financeira
      let score = 0
      if (savingsRate >= 20) score += 40
      else if (savingsRate > 0) score += Math.round((savingsRate / 20) * 40)
      const topCatPercent = categories[0] ? (categories[0] as any).percent : 0
      if (topCatPercent < 40) score += 20
      if ((goals?.length ?? 0) > 0) score += 20
      if (totalIncome > 0) score += 20

      setData({ totalIncome, totalExpense, savingsRate, categories, byDayArray, top5, score, transactionCount: transactions.length })
      setLoading(false)
    }
    load()
  }, [month, year])

  const s = {
    card: { backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(16px, 4vw, 20px) clamp(16px, 5vw, 32px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky' as const, top: 0, backgroundColor: 'rgba(12,12,15,0.9)', backdropFilter: 'blur(12px)', zIndex: 10 },
  }

  const scoreColor = !data ? '#888' : data.score >= 80 ? '#2DCC8F' : data.score >= 50 ? '#F5A623' : '#FF5E5E'

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      <header style={s.header}>
        <h1 style={{ fontSize: 'clamp(14px, 4vw, 15px)', fontWeight: 500, color: '#F0EFE8', margin: 0 }}>Relatórios</h1>
        {/* Seletor de mês */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#141418', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '4px' }}>
          {MONTHS.map((m, i) => (
            <button key={m} onClick={() => setMonth(i + 1)} style={{
              padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif',
              backgroundColor: month === i + 1 ? 'rgba(45,204,143,0.15)' : 'transparent',
              color: month === i + 1 ? '#2DCC8F' : 'rgba(255,255,255,0.35)',
            }}>
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: 'clamp(16px, 5vw, 32px)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0' }}>Carregando relatório...</div>
        ) : !data ? null : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Receitas', value: formatCurrency(data.totalIncome), color: '#2DCC8F' },
                { label: 'Gastos', value: formatCurrency(data.totalExpense), color: '#FF5E5E' },
                { label: 'Saldo', value: formatCurrency(data.totalIncome - data.totalExpense), color: data.totalIncome >= data.totalExpense ? '#2DCC8F' : '#FF5E5E' },
                { label: 'Taxa Poupança', value: `${data.savingsRate.toFixed(1)}%`, color: data.savingsRate >= 20 ? '#5B8DEF' : '#F5A623' },
              ].map(item => (
                <div key={item.label} style={s.card}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{item.label}</p>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Score + Gráfico */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
              {/* Gráfico por dia */}
              <div style={s.card}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Gastos por Dia</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.byDayArray} barGap={2}>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(240,239,232,0.3)', fontSize: 10 }} interval={4} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1C1C22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px' }}
                      formatter={(v: any) => [formatCurrency(v)]}
                    />
                    <Bar dataKey="expense" fill="rgba(255,94,94,0.6)" radius={[3,3,0,0]} />
                    <Bar dataKey="income" fill="rgba(45,204,143,0.7)" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Score de saúde */}
              <div style={{ ...s.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Saúde Financeira</p>
                <div style={{ position: 'relative' as const, width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.score / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div style={{ position: 'absolute' as const, textAlign: 'center' as const }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: scoreColor, margin: 0 }}>{data.score}</p>
                    <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>de 100</p>
                  </div>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: scoreColor }}>
                  {data.score >= 80 ? '🏆 Excelente' : data.score >= 50 ? '👍 Bom' : '⚠️ Atenção'}
                </p>
              </div>
            </div>

            {/* Categorias */}
            {data.categories.length > 0 && (
              <div style={s.card}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Gastos por Categoria</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.categories.map((cat: any) => (
                    <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>
                        {cat.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{cat.name}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>{formatCurrency(cat.total)}</span>
                        </div>
                        <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cat.percent}%`, backgroundColor: cat.color, borderRadius: '999px' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', width: '32px', textAlign: 'right' as const }}>{cat.percent.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top 5 gastos */}
            {data.top5.length > 0 && (
              <div style={s.card}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Top 5 Maiores Gastos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.top5.map((tx: any, i: number) => {
                    const txCat = tx.category_id ? getCategoryById(tx.category_id) : null
                    return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', width: '20px' }}>#{i + 1}</span>
                      <span style={{ fontSize: '15px' }}>{txCat?.icon ?? '📦'}</span>
                      <span style={{ flex: 1, fontSize: '13px' }}>{tx.description}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF5E5E' }}>{formatCurrency(tx.amount)}</span>
                    </div>
                  )})}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
