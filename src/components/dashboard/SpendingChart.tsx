'use client'
// src/components/dashboard/SpendingChart.tsx
// Gráfico de barras: Receitas x Gastos dos últimos 6 meses

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthData {
  month: string
  receitas: number
  gastos: number
  isCurrent: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1C1C22] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white/50 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="font-semibold">{p.name === 'receitas' ? '↑ Receitas' : '↓ Gastos'}:</span>
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export function SpendingChart({ userId }: { userId: string }) {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: true, storageKey: 'grana-auth', storage: window.localStorage } }
      )
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }

      // Buscar todos os últimos 6 meses de uma vez
      const now = new Date()
      const startD = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      const startDate = startD.toISOString().split('T')[0]
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: txs } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', session.user.id)
        .gte('date', startDate)
        .lte('date', endDate)

      const byMonth: Record<string, { receitas: number; gastos: number }> = {}
      for (const tx of txs ?? []) {
        const key = tx.date.slice(0, 7) // "2026-03"
        if (!byMonth[key]) byMonth[key] = { receitas: 0, gastos: 0 }
        if (tx.type === 'income') byMonth[key].receitas += tx.amount
        else byMonth[key].gastos += tx.amount
      }

      const months: MonthData[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        months.push({
          month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          receitas: byMonth[key]?.receitas ?? 0,
          gastos:   byMonth[key]?.gastos ?? 0,
          isCurrent: i === 0,
        })
      }

      setData(months)
      setLoading(false)
    }
    load()
  }, [userId])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold">Receitas × Gastos</h3>
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2DCC8F] inline-block" />Receitas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF5E5E]/60 inline-block" />Gastos</span>
        </div>
      </div>

      {loading ? (
        <div className="h-44 flex items-center justify-center text-white/20 text-sm">Carregando...</div>
      ) : (
        <ResponsiveContainer width="100%" height={176}>
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              axisLine={false} tickLine={false}
              tick={{ fill: 'rgba(240,239,232,0.35)', fontSize: 11 }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="receitas" fill="#2DCC8F" radius={[4,4,0,0]}
              opacity={0.9}
            />
            <Bar dataKey="gastos" fill="rgba(255,94,94,0.6)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
