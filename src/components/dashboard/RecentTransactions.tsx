// src/components/dashboard/RecentTransactions.tsx
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface Transaction {
  id: string; type: string; amount: number; description: string; date: string
  categories?: { name: string; icon: string; color: string } | null
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold">Últimas Transações</h3>
        <Link href="/transacoes" className="text-xs text-[#2DCC8F] hover:opacity-70 transition-opacity">
          Ver todas →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-10 text-center text-white/25 text-sm">
          Nenhuma transação ainda.<br />
          <span className="text-[#2DCC8F] cursor-pointer">Adicionar primeiro lançamento</span>
        </div>
      ) : (
        <div>
          {transactions.map((tx, i) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: tx.type === 'income' ? 'rgba(45,204,143,0.1)' : 'rgba(255,94,94,0.08)' }}
              >
                {tx.categories?.icon ?? (tx.type === 'income' ? '💼' : '📦')}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-white/30">{formatDate(tx.date, 'dd MMM')}</span>
                  {tx.categories && (
                    <span className="text-[10px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded-full">
                      {tx.categories.name}
                    </span>
                  )}
                </div>
              </div>

              <span className={`text-sm font-semibold font-serif flex-shrink-0 ${
                tx.type === 'income' ? 'text-[#2DCC8F]' : 'text-[#FF5E5E]'
              }`}>
                {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
