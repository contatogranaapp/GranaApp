// src/app/api/goals/route.ts

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase-server'
import { calcMonthsToGoal } from '@/lib/utils'

// GET /api/goals
export async function GET(request: Request) {
  const supabase = createApiClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'active'

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', status)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Adiciona campos calculados
  const enriched = data.map(g => ({
    ...g,
    progress_percent: g.target_amount > 0
      ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
      : 0,
    months_remaining: g.monthly_target
      ? calcMonthsToGoal(g.target_amount - g.current_amount, g.monthly_target)
      : null,
  }))

  return NextResponse.json({ data: enriched })
}

// POST /api/goals
export async function POST(request: Request) {
  const supabase = createApiClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { title, target_amount, deadline, icon, description } = body

  if (!title || !target_amount) {
    return NextResponse.json({ error: 'Título e valor alvo são obrigatórios' }, { status: 400 })
  }

  // Calcular meta mensal automaticamente
  let monthly_target = body.monthly_target ?? null
  if (!monthly_target && deadline) {
    const months = Math.max(1,
      (new Date(deadline).getFullYear() - new Date().getFullYear()) * 12 +
      (new Date(deadline).getMonth() - new Date().getMonth())
    )
    monthly_target = parseFloat((target_amount / months).toFixed(2))
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: session.user.id,
      title,
      target_amount,
      current_amount: 0,
      deadline: deadline ?? null,
      monthly_target,
      icon: icon ?? '🎯',
      description: description ?? null,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// PATCH /api/goals?id=xxx — atualizar progresso ou status
export async function PATCH(request: Request) {
  const supabase = createApiClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('goals')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
