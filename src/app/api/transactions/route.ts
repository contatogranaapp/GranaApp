// src/app/api/transactions/route.ts

import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase-server'
import { detectCategory } from '@/lib/utils'

// GET /api/transactions?month=3&year=2026&page=1&limit=20&type=expense
export async function GET(request: Request) {
  const supabase = createApiClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const type = searchParams.get('type') // 'expense' | 'income' | null
  const category = searchParams.get('category')

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0] // último dia do mês

  let query = supabase
    .from('transactions')
    .select('*, categories(id, name, icon, color), accounts(id, name, icon)', { count: 'exact' })
    .eq('user_id', session.user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (type) query = query.eq('type', type)
  if (category) query = query.eq('category_id', category)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count, page, pageSize: limit })
}

// POST /api/transactions
export async function POST(request: Request) {
  const supabase = createApiClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { type, amount, description, date, category_id, account_id, notes, is_installment, installment_total, is_recurring, recurring_interval } = body

  // Validação básica
  if (!type || !amount || !description || !date) {
    return NextResponse.json({ error: 'Campos obrigatórios: type, amount, description, date' }, { status: 400 })
  }
  if (amount <= 0) return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 })

  // Auto-detectar categoria se não fornecida
  const finalCategoryId = category_id ?? detectCategory(description)

  // Lidar com parcelamento
  if (is_installment && installment_total > 1) {
    const groupId = crypto.randomUUID()
    const installments = []
    const installmentDate = new Date(date)

    for (let i = 1; i <= installment_total; i++) {
      installments.push({
        user_id: session.user.id,
        type, amount: amount / installment_total,
        description: `${description} (${i}/${installment_total})`,
        date: installmentDate.toISOString().split('T')[0],
        category_id: finalCategoryId,
        account_id: account_id ?? null,
        notes: notes ?? null,
        is_installment: true,
        installment_current: i,
        installment_total,
        installment_group_id: groupId,
        source: 'manual',
      })
      installmentDate.setMonth(installmentDate.getMonth() + 1)
    }

    const { data, error } = await supabase.from('transactions').insert(installments).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  }

  // Transação simples
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: session.user.id,
      type, amount, description, date,
      category_id: finalCategoryId,
      account_id: account_id ?? null,
      notes: notes ?? null,
      is_installment: false,
      is_recurring: is_recurring ?? false,
      recurring_interval: is_recurring ? recurring_interval : null,
      source: 'manual',
    })
    .select('*, categories(id, name, icon, color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// DELETE /api/transactions?id=xxx
export async function DELETE(request: Request) {
  const supabase = createApiClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id) // Garante que só deleta do próprio usuário

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
