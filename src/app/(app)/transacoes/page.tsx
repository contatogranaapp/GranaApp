'use client'
// src/app/(app)/transacoes/page.tsx

import { useState, useEffect } from 'react'
import { Search, Trash2, Filter } from 'lucide-react'
import { AddTransactionButton } from '@/components/dashboard/AddTransactionButton'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { getCategoryById } from '@/lib/constants'

interface Transaction {
  id: string; type: string; amount: number; description: string
  date: string; notes?: string; category_id?: string
  categories?: { name: string; icon: string; color: string } | null
  accounts?: { name: string } | null
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

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

export default function TransacoesPage() {
  const router = useRouter()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())
  const [type, setType] = useState<'all'|'expense'|'income'>('all')
  const [search, setSearch] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const supabase = await getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    let query = supabase
      .from('transactions')
      .select('*, accounts(name)', { count: 'exact' })
      .eq('user_id', session.user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, count: exactCount } = await query

    setTransactions(data ?? [])
    setCount(exactCount ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [month, year, type])

  async function del(id: string) {
    if (!confirm('Excluir esta transação?')) return
    const supabase = await getSupabase()
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(t => t.filter(x => x.id !== id))
  }

  const filtered = transactions.filter(t =>
    !search || t.description.toLowerCase().includes(search.toLowerCase())
  )

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0)

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 border-b border-white/[0.07] sticky top-0 bg-[#0C0C0F]/90 backdrop-blur-md z-10">
        <h1 className="text-[clamp(14px,4vw,16px)] font-medium">Transações</h1>
        <AddTransactionButton />
      </header>

      <div className="p-4 md:p-8 flex flex-col gap-6">
        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mês */}
          <div className="flex items-center gap-1 bg-[#141418] border border-white/[0.07] rounded-xl p-1">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setMonth(i+1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  month === i+1 ? 'bg-[#2DCC8F]/10 text-[#2DCC8F]' : 'text-white/35 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Tipo */}
          <div className="flex items-center gap-1 bg-[#141418] border border-white/[0.07] rounded-xl p-1">
            {(['all','income','expense'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  type === t ? 'bg-[#2DCC8F]/10 text-[#2DCC8F]' : 'text-white/35 hover:text-white'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'income' ? '↑ Receitas' : '↓ Gastos'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[#141418] border border-white/[0.07] rounded-xl px-3 py-2 flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
            <input
              className="bg-transparent text-sm outline-none placeholder-white/25 text-white flex-1"
              placeholder="Buscar transação..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Receitas', value: totalIncome, color: 'text-[#2DCC8F]' },
            { label: 'Gastos', value: totalExpense, color: 'text-[#FF5E5E]' },
            { label: 'Saldo', value: totalIncome - totalExpense, color: totalIncome >= totalExpense ? 'text-[#2DCC8F]' : 'text-[#FF5E5E]' },
          ].map(item => (
            <div key={item.label} className="card px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-white/40">{item.label}</span>
              <span className={`font-serif text-lg ${item.color}`}>{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-white/35">{filtered.length} transação(ões)</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-white/25 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-white/25 text-sm">
              Nenhuma transação encontrada.
            </div>
          ) : (
            <div>
              {filtered.map((tx) => {
                const cat = tx.category_id ? getCategoryById(tx.category_id) : null
                return (
                <div key={tx.id} className="group flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: tx.type === 'income' ? 'rgba(45,204,143,0.1)' : 'rgba(255,94,94,0.08)' }}
                  >
                    {cat?.icon ?? (tx.type === 'income' ? '💼' : '📦')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/30">{formatDate(tx.date)}</span>
                      {cat && (
                        <span className="hidden md:inline-block text-[10px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded-full">
                          {cat.name}
                        </span>
                      )}
                      {tx.notes && (
                        <span className="hidden md:inline-block text-[10px] text-white/20 truncate max-w-[120px]">{tx.notes}</span>
                      )}
                    </div>
                  </div>

                  <span className={`text-sm font-semibold font-serif flex-shrink-0 ${
                    tx.type === 'income' ? 'text-[#2DCC8F]' : 'text-[#FF5E5E]'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>

                  <button
                    onClick={() => del(tx.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-[#FF5E5E]/10 flex items-center justify-center text-[#FF5E5E] hover:bg-[#FF5E5E]/20 transition-all ml-1 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
