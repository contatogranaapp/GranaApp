// src/components/goals/GoalsWidget.tsx
import Link from 'next/link'
import { formatCurrency, calcProgress } from '@/lib/utils'
import type { Goal } from '@/types'

export function GoalsWidget({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null

  const COLORS = ['#F5A623', '#5B8DEF', '#2DCC8F', '#A78BFA', '#FF5E5E']

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Metas Ativas</h3>
        <Link href="/metas" className="text-xs text-[#2DCC8F] hover:opacity-70 transition-opacity">
          Ver todas →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {goals.map((goal, i) => {
          const pct = calcProgress(goal.current_amount, goal.target_amount)
          const color = COLORS[i % COLORS.length]

          return (
            <div key={goal.id} className="card p-4 hover:border-white/15 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${color}15` }}>
                  {goal.icon}
                </div>
                <span className="font-serif text-lg" style={{ color }}>{pct}%</span>
              </div>

              <p className="text-sm font-semibold mb-0.5 truncate">{goal.title}</p>
              {goal.monthly_target && (
                <p className="text-[11px] text-white/35 mb-3">
                  {formatCurrency(goal.monthly_target)}/mês
                </p>
              )}

              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-white/30">
                <span className="font-semibold text-white/60">{formatCurrency(goal.current_amount)}</span>
                <span>{formatCurrency(goal.target_amount)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
