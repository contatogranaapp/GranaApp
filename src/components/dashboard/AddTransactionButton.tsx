'use client'
// src/components/dashboard/AddTransactionButton.tsx

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { id: 'cat_alimentacao', icon: '🍕', name: 'Alimentação' },
  { id: 'cat_transporte',  icon: '🚗', name: 'Transporte' },
  { id: 'cat_moradia',     icon: '🏠', name: 'Moradia' },
  { id: 'cat_saude',       icon: '💊', name: 'Saúde' },
  { id: 'cat_lazer',       icon: '🎮', name: 'Lazer' },
  { id: 'cat_educacao',    icon: '📚', name: 'Educação' },
  { id: 'cat_assinaturas', icon: '📱', name: 'Assinaturas' },
  { id: 'cat_salario',     icon: '💼', name: 'Salário' },
  { id: 'cat_freelance',   icon: '💻', name: 'Freelance' },
  { id: 'cat_outros_gast', icon: '📦', name: 'Outros' },
]

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

export function AddTransactionButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category_id: 'cat_alimentacao',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.description || !form.amount) return
    setLoading(true)
    setError('')
    try {
      const supabase = await getSupabase()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Sessão expirada. Faça login novamente.')
        return
      }

      const { error: dbError } = await supabase.from('transactions').insert({
        user_id: session.user.id,
        type,
        amount: parseFloat(form.amount),
        description: form.description,
        date: form.date,
        category_id: form.category_id,
        notes: form.notes || null,
        is_installment: false,
        is_recurring: false,
        source: 'manual',
      })

      if (dbError) {
        setError(dbError.message)
        return
      }

      setOpen(false)
      setForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category_id: 'cat_alimentacao', notes: '' })
      router.refresh()
    } catch (e: any) {
      setError(e.message ?? 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const expenseCategories = CATEGORIES.filter(c => !['cat_salario','cat_freelance'].includes(c.id))
  const incomeCategories  = CATEGORIES.filter(c => ['cat_salario','cat_freelance','cat_outros_gast'].includes(c.id))
  const visibleCategories = type === 'expense' ? expenseCategories : incomeCategories

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-[#2DCC8F] text-[#0C0C0F] font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-88 hover:-translate-y-px transition-all duration-150"
      >
        <Plus className="w-4 h-4" />
        Lançamento
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo lançamento" subtitle="Adicione uma receita ou gasto">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(['expense','income'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setType(t); set('category_id', t === 'expense' ? 'cat_alimentacao' : 'cat_salario') }}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                type === t
                  ? t === 'expense'
                    ? 'bg-[#FF5E5E]/10 border-[#FF5E5E]/30 text-[#FF5E5E]'
                    : 'bg-[#2DCC8F]/10 border-[#2DCC8F]/30 text-[#2DCC8F]'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/40'
              }`}
            >
              {t === 'expense' ? '↓ Gasto' : '↑ Receita'}
            </button>
          ))}
        </div>

        {/* Descrição */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-white/40 mb-1.5">Descrição</label>
          <input className="input" placeholder="Ex: Mercado, Salário, Uber..." value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        {/* Valor + Data */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-1.5">Valor (R$)</label>
            <input className="input" type="number" min="0.01" step="0.01" placeholder="0,00" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-1.5">Data</label>
            <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>

        {/* Categoria */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-white/40 mb-1.5">Categoria</label>
          <div className="grid grid-cols-4 gap-1.5">
            {visibleCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => set('category_id', cat.id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center transition-all ${
                  form.category_id === cat.id
                    ? 'bg-[#2DCC8F]/10 border-[#2DCC8F]/30 text-[#2DCC8F]'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/15'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-[9px] leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Observação */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-white/40 mb-1.5">Observação (opcional)</label>
          <input className="input" placeholder="Detalhes extras..." value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-3 px-3 py-2 bg-[#FF5E5E]/10 border border-[#FF5E5E]/20 rounded-xl text-[#FF5E5E] text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="primary" className="flex-[2]"
            onClick={handleSubmit}
            loading={loading}
            disabled={!form.description || !form.amount}
          >
            Salvar lançamento
          </Button>
        </div>
      </Modal>
    </>
  )
}
