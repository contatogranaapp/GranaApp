// src/components/dashboard/AIInsightBanner.tsx
import Link from 'next/link'

interface Props {
  totalIncome: number
  totalExpense: number
  savingsRate: number
  categories: { name: string; total: number; percent: number }[]
}

export function AIInsightBanner({ totalIncome, totalExpense, savingsRate, categories }: Props) {
  // Gerar insight baseado nos dados reais
  const topCategory = categories[0]
  const balance = totalIncome - totalExpense

  let insight = ''
  let icon = '✦'

  if (totalIncome === 0) {
    insight = 'Adicione seu primeiro lançamento ou converse com a IA para começar a acompanhar suas finanças.'
  } else if (savingsRate < 0) {
    insight = `Seus gastos estão ${Math.abs(savingsRate).toFixed(0)}% acima das receitas este mês. Converse com a IA para entender onde cortar.`
    icon = '⚠️'
  } else if (topCategory && topCategory.percent > 40) {
    insight = `${topCategory.name} representa ${topCategory.percent.toFixed(0)}% dos seus gastos. Quer dicas para reduzir?`
  } else if (savingsRate >= 20) {
    insight = `Excelente! Você está guardando ${savingsRate.toFixed(0)}% da renda — acima dos 20% recomendados. Continue assim! 🎉`
    icon = '🏆'
  } else {
    insight = `Você economizou ${savingsRate.toFixed(0)}% este mês. Aumentar para 20% aceleraria suas metas em muito.`
  }

  return (
    <Link href="/chat">
      <div className="flex items-center gap-4 bg-gradient-to-r from-[#2DCC8F]/08 to-[#5B8DEF]/05 border border-[#2DCC8F]/18 rounded-2xl px-5 py-3.5 hover:border-[#2DCC8F]/30 transition-all duration-200 cursor-pointer group">
        <div className="w-9 h-9 rounded-xl bg-[#2DCC8F]/12 border border-[#2DCC8F]/20 flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-[#2DCC8F] font-semibold mb-0.5">Insight da IA</p>
          <p className="text-sm text-white/70 leading-snug">{insight}</p>
        </div>
        <span className="text-xs text-[#2DCC8F] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          Conversar →
        </span>
      </div>
    </Link>
  )
}
