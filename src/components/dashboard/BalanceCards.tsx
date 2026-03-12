// src/components/dashboard/BalanceCards.tsx
import { formatCurrency } from '@/lib/utils'

interface Props {
  totalIncome: number
  totalExpense: number
  balance: number
  savingsRate: number
}

export function BalanceCards({ totalIncome, totalExpense, balance, savingsRate }: Props) {
  const cards = [
    {
      label: 'Saldo do Mês',
      value: formatCurrency(balance),
      icon: '💰',
      color: balance >= 0 ? 'text-[#2DCC8F]' : 'text-[#FF5E5E]',
      bg: balance >= 0 ? 'bg-[#2DCC8F]/10 border-[#2DCC8F]/20' : 'bg-[#FF5E5E]/10 border-[#FF5E5E]/20',
      trend: balance >= 0 ? '▲ positivo' : '▼ negativo',
      trendColor: balance >= 0 ? 'text-[#2DCC8F]' : 'text-[#FF5E5E]',
    },
    {
      label: 'Receitas',
      value: formatCurrency(totalIncome),
      icon: '↑',
      color: 'text-[#F0EFE8]',
      bg: 'bg-[#141418] border-white/[0.07]',
      trend: 'Total do mês',
      trendColor: 'text-white/30',
    },
    {
      label: 'Gastos',
      value: formatCurrency(totalExpense),
      icon: '↓',
      color: 'text-[#FF5E5E]',
      bg: 'bg-[#141418] border-white/[0.07]',
      trend: totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(0)}% da renda` : '—',
      trendColor: 'text-white/30',
    },
    {
      label: 'Taxa de Poupança',
      value: `${savingsRate.toFixed(1)}%`,
      icon: '📈',
      color: savingsRate >= 20 ? 'text-[#5B8DEF]' : 'text-[#F5A623]',
      bg: 'bg-[#141418] border-white/[0.07]',
      trend: savingsRate >= 20 ? '▲ meta atingida' : '⚠ ideal: 20%+',
      trendColor: savingsRate >= 20 ? 'text-[#5B8DEF]' : 'text-[#F5A623]',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`${card.bg} border rounded-2xl p-5 animate-fade-up`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40 font-medium">{card.label}</span>
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-sm">
              {card.icon}
            </div>
          </div>
          <div className={`font-serif text-2xl font-normal mb-1.5 ${card.color}`}>
            {card.value}
          </div>
          <div className={`text-xs ${card.trendColor}`}>{card.trend}</div>
        </div>
      ))}
    </div>
  )
}
