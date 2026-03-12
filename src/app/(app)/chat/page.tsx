'use client'
// src/app/(app)/chat/page.tsx

import { useEffect, useState } from 'react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { getMonthRange, calcSavingsRate } from '@/lib/utils'
import { getCategoryById } from '@/lib/constants'
import { useRouter } from 'next/navigation'

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

export default function ChatPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = await getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const userId = session.user.id
      const now = new Date()
      const { start, end } = getMonthRange(now.getFullYear(), now.getMonth() + 1)

      const [profileResult, transactionsResult, goalsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false })
          .limit(30),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active'),
      ])

      const profile = profileResult.data!
      const transactions = transactionsResult.data ?? []
      const goals = goalsResult.data ?? []

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

      const byCategory = transactions.reduce((acc, t) => {
        if (t.type !== 'expense') return acc
        const cat = getCategoryById(t.category_id)
        
        const key = cat.name
        if (!acc[key]) acc[key] = { category_icon: cat.icon, category_name: key, category_color: cat.color, total: 0, transaction_count: 0, type: 'expense' as const, category_id: key, percent_of_total: 0 }
        acc[key].total += t.amount
        acc[key].transaction_count++
        return acc
      }, {} as Record<string, { category_id: string; category_icon: string; category_name: string; category_color: string; total: number; transaction_count: number; type: 'expense'; percent_of_total: number }>)

      const summary = {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense,
        savings_rate: calcSavingsRate(totalIncome, totalExpense),
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        by_category: Object.values(byCategory).sort((a: any, b: any) => b.total - a.total).map((c: any) => ({
          ...c,
          percent_of_total: totalExpense > 0 ? (c.total / totalExpense) * 100 : 0,
        })),
      }

      const goalsWithProgress = goals.map(g => ({
        ...g,
        progress_percent: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
      }))

      setData({
        profile,
        summary,
        goalsWithProgress,
        transactions,
      })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading || !data) {
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
          borderTop: '3px solid #00F0FF',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
          Gerando insight com IA...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <ChatInterface
        profile={data.profile}
        summary={data.summary}
        goals={data.goalsWithProgress}
        recentTransactions={data.transactions.slice(0, 10).map((t: any) => ({
          type: t.type,
          description: t.description,
          amount: t.amount,
          date: t.date,
        }))}
        isPro={data.profile.plan === 'pro'}
      />
    </div>
  )
}
