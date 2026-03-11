// src/components/dashboard/CategoryBreakdown.tsx
import { formatCurrency } from '@/lib/utils'

interface Category {
  id: string; name: string; icon: string; color: string
  total: number; count: number; percent: number
}

export function CategoryBreakdown({ categories, totalExpense }: { categories: Category[]; totalExpense: number }) {
  const top = categories.slice(0, 5)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Por Categoria</h3>
        <span className="text-xs text-white/30">{formatCurrency(totalExpense)} total</span>
      </div>

      {top.length === 0 ? (
        <div className="text-center py-8 text-white/25 text-sm">Nenhum gasto ainda</div>
      ) : (
        <div className="flex flex-col gap-3">
          {top.map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${cat.color}18` }}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium truncate">{cat.name}</span>
                  <span className="text-xs font-semibold font-serif ml-2 flex-shrink-0">
                    {formatCurrency(cat.total)}
                  </span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.percent}%`, background: cat.color }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-white/25 w-8 text-right flex-shrink-0">
                {cat.percent.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
