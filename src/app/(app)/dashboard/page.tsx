'use client'
// src/app/(app)/dashboard/page.tsx

import { useEffect, useState } from 'react'
import { AddTransactionButton } from '@/components/dashboard/AddTransactionButton'
import { BalanceCards } from '@/components/dashboard/BalanceCards'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { GoalsWidget } from '@/components/goals/GoalsWidget'
import { AIInsightBanner } from '@/components/dashboard/AIInsightBanner'
import { getCategoryById } from '@/lib/constants'

interface DashboardData {
  userId: string
  totalIncome: number
  totalExpense: number
  savingsRate: number
  categories: any[]
  transactions: any[]
  goals: any[]
}

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = await getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userId = session.user.id
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const [txResult, goalsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(3),
      ])

      const transactions = txResult.data ?? []
      const goals = goalsResult.data ?? []

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0)
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0)
      const savingsRate = totalIncome > 0
        ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100)
        : 0

      // Agrupar por categoria
      const byCat = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const cat = getCategoryById(t.category_id)
          const key = cat.id
          if (!acc[key]) acc[key] = {
            id: key, name: cat.name,
            icon: cat.icon, color: cat.color,
            total: 0, count: 0,
          }
          acc[key].total += t.amount
          acc[key].count++
          return acc
        }, {} as Record<string, any>)

      const categories = Object.values(byCat)
        .sort((a: any, b: any) => b.total - a.total)
        .map((c: any) => ({
          ...c,
          percent: totalExpense > 0 ? (c.total / totalExpense) * 100 : 0,
        }))

      setData({
        userId,
        totalIncome,
        totalExpense,
        savingsRate,
        categories,
        transactions,
        goals: goals.map(g => ({
          ...g,
          progress_percent: g.target_amount > 0
            ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
            : 0,
        })),
      })
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: '#0C0C0F',
        flexDirection: 'column', gap: '16px',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid rgba(45,204,143,0.2)',
          borderTop: '3px solid #2DCC8F',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
          Carregando dashboard...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(16px, 4vw, 20px) clamp(16px, 5vw, 32px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0,
        backgroundColor: 'rgba(12,12,15,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <h1 style={{ fontSize: 'clamp(14px, 4vw, 15px)', fontWeight: 500, color: '#F0EFE8', margin: 0 }}>
          Visão Geral —{' '}
          <span style={{ color: 'rgba(240,239,232,0.4)' }}>
            {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
        </h1>
        <AddTransactionButton />
      </header>

      {/* Content */}
      <div style={{ padding: 'clamp(16px, 5vw, 32px)', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <AIInsightBanner
          totalIncome={data.totalIncome}
          totalExpense={data.totalExpense}
          categories={data.categories}
          savingsRate={data.savingsRate}
        />

        <BalanceCards
          totalIncome={data.totalIncome}
          totalExpense={data.totalExpense}
          balance={data.totalIncome - data.totalExpense}
          savingsRate={data.savingsRate}
        />

        <div className="grid-cols-1 text-red md:grid-cols-1 sm:grid-cols-1" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}>
          <SpendingChart userId={data.userId} />
          <CategoryBreakdown
            categories={data.categories}
            totalExpense={data.totalExpense}
          />
        </div>

        {data.goals.length > 0 && <GoalsWidget goals={data.goals} />}

        <RecentTransactions transactions={data.transactions.slice(0, 8)} />
      </div>
    </div>
  )
}
