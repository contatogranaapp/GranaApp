// src/app/api/reports/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startDate = `${year}-${String(month).padStart(2,'0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [profileRes, txRes, goalsRes, budgetsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('transactions').select('*, categories(name,icon,color)').eq('user_id', user.id).gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('budgets').select('*, categories(name,icon,color)').eq('user_id', user.id).eq('month', month).eq('year', year),
  ])

  const profile = profileRes.data
  const txs = txRes.data ?? []
  const goals = goalsRes.data ?? []
  const budgets = budgetsRes.data ?? []

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

  // Por categoria
  const byCategory: Record<string, { name: string, icon: string, color: string, total: number }> = {}
  txs.filter(t => t.type === 'expense').forEach(t => {
    const key = t.category_id || 'outros'
    if (!byCategory[key]) byCategory[key] = { name: t.categories?.name ?? 'Outros', icon: t.categories?.icon ?? '📦', color: t.categories?.color ?? '#6B7280', total: 0 }
    byCategory[key].total += t.amount
  })
  const topCategories = Object.values(byCategory).sort((a, b) => b.total - a.total).slice(0, 5)

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  function scoreColor(s: number) {
    if (s >= 80) return '#2DCC8F'
    if (s >= 60) return '#F5A623'
    return '#FF5E5E'
  }

  // Calcular score
  let score = 50
  if (savingsRate >= 20) score += 20
  else if (savingsRate >= 10) score += 10
  else if (savingsRate < 0) score -= 20
  if (balance >= 0) score += 10
  if (goals.length > 0) score += 10
  if (budgets.length > 0) score += 10
  score = Math.max(0, Math.min(100, score))

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório Grana - ${MONTHS[month-1]} ${year}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; background: #0C0C0F; color: #F0EFE8; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 40px; height: 40px; background: #2DCC8F; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: #0C0C0F; font-family: Georgia, serif; font-style: italic; }
  .logo-text { font-size: 24px; font-style: italic; color: #F0EFE8; }
  .period { text-align: right; }
  .period h2 { font-size: 20px; color: #F0EFE8; }
  .period p { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 4px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: #141418; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 20px; }
  .stat-label { font-size: 11px; font-family: 'DM Sans', sans-serif; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .stat-value { font-size: 22px; font-style: italic; }
  .green { color: #2DCC8F; }
  .red { color: #FF5E5E; }
  .yellow { color: #F5A623; }
  .blue { color: #5B8DEF; }
  .section { background: #141418; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
  .section-title { font-size: 16px; font-style: italic; color: #F0EFE8; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .row:last-child { border-bottom: none; }
  .bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 999px; }
  .tx-date { font-size: 11px; color: rgba(255,255,255,0.3); font-family: 'DM Sans', sans-serif; min-width: 80px; }
  .tx-desc { flex: 1; font-size: 13px; font-family: 'DM Sans', sans-serif; }
  .tx-cat { font-size: 11px; color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif; }
  .tx-amount { font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif; min-width: 90px; text-align: right; }
  .score-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; font-family: 'DM Sans', sans-serif; margin: 0 auto 16px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.07); font-size: 12px; color: rgba(255,255,255,0.3); font-family: 'DM Sans', sans-serif; }
  @media print { body { background: white; color: black; } }
</style>
</head>
<body>

<div class="header">
  <div class="logo">
    <div class="logo-icon">G</div>
    <span class="logo-text">Grana</span>
  </div>
  <div class="period">
    <h2>Relatório Mensal</h2>
    <p>${MONTHS[month-1]} de ${year} · ${profile?.name ?? ''}</p>
  </div>
</div>

<!-- KPIs -->
<div class="grid3">
  <div class="stat-card">
    <div class="stat-label">Receitas</div>
    <div class="stat-value green">${fmt(totalIncome)}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Gastos</div>
    <div class="stat-value red">${fmt(totalExpense)}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Saldo</div>
    <div class="stat-value ${balance >= 0 ? 'green' : 'red'}">${fmt(balance)}</div>
  </div>
</div>

<div class="grid3">
  <div class="stat-card">
    <div class="stat-label">Taxa de Poupança</div>
    <div class="stat-value ${savingsRate >= 20 ? 'green' : savingsRate >= 10 ? 'yellow' : 'red'}">${savingsRate.toFixed(1)}%</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Transações</div>
    <div class="stat-value blue">${txs.length}</div>
  </div>
  <div class="stat-card">
    <div class="stat-label">Score de Saúde</div>
    <div class="stat-value" style="color: ${scoreColor(score)}">${score}/100</div>
  </div>
</div>

<!-- Top Categorias -->
${topCategories.length > 0 ? `
<div class="section">
  <div class="section-title">🗂️ Gastos por Categoria</div>
  ${topCategories.map(cat => `
  <div class="row">
    <span style="font-size:18px">${cat.icon}</span>
    <span style="flex:1;font-size:13px;font-family:'DM Sans',sans-serif">${cat.name}</span>
    <div class="bar-bg">
      <div class="bar-fill" style="width:${Math.min(100,(cat.total/totalExpense)*100).toFixed(0)}%;background:${cat.color}"></div>
    </div>
    <span style="font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;color:#FF5E5E;min-width:90px;text-align:right">${fmt(cat.total)}</span>
    <span style="font-size:11px;color:rgba(255,255,255,0.4);font-family:'DM Sans',sans-serif;min-width:40px;text-align:right">${totalExpense > 0 ? ((cat.total/totalExpense)*100).toFixed(0) : 0}%</span>
  </div>`).join('')}
</div>` : ''}

<!-- Orçamentos -->
${budgets.length > 0 ? `
<div class="section">
  <div class="section-title">🎯 Orçamentos do Mês</div>
  ${budgets.map((b: any) => {
    const spent = 0 // seria calculado
    const pct = b.limit_amount > 0 ? Math.min(100, (spent / b.limit_amount) * 100) : 0
    return `
  <div class="row">
    <span style="font-size:16px">${b.categories?.icon ?? '📦'}</span>
    <span style="flex:1;font-size:13px;font-family:'DM Sans',sans-serif">${b.categories?.name ?? ''}</span>
    <div class="bar-bg">
      <div class="bar-fill" style="width:${pct.toFixed(0)}%;background:${pct>=100?'#FF5E5E':pct>=80?'#F5A623':'#2DCC8F'}"></div>
    </div>
    <span style="font-size:12px;font-family:'DM Sans',sans-serif;color:rgba(255,255,255,0.5);min-width:100px;text-align:right">Limite ${fmt(b.limit_amount)}</span>
  </div>`}).join('')}
</div>` : ''}

<!-- Metas -->
${goals.length > 0 ? `
<div class="section">
  <div class="section-title">🏆 Metas em Andamento</div>
  ${goals.map((g: any) => {
    const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
    return `
  <div class="row">
    <span style="font-size:18px">${g.icon}</span>
    <div style="flex:1">
      <div style="font-size:13px;font-family:'DM Sans',sans-serif">${g.title}</div>
      <div class="bar-bg" style="margin-top:6px">
        <div class="bar-fill" style="width:${pct.toFixed(0)}%;background:#2DCC8F"></div>
      </div>
    </div>
    <span style="font-size:12px;font-family:'DM Sans',sans-serif;color:#2DCC8F;min-width:100px;text-align:right">${fmt(g.current_amount)} / ${fmt(g.target_amount)}</span>
  </div>`}).join('')}
</div>` : ''}

<!-- Últimas transações -->
${txs.length > 0 ? `
<div class="section">
  <div class="section-title">📋 Transações do Mês (${txs.length})</div>
  ${txs.slice(0,20).map(tx => `
  <div class="row">
    <span class="tx-date">${new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}</span>
    <span style="font-size:16px">${tx.categories?.icon ?? (tx.type === 'income' ? '💰' : '📦')}</span>
    <div style="flex:1">
      <div class="tx-desc">${tx.description}</div>
      <div class="tx-cat">${tx.categories?.name ?? ''}</div>
    </div>
    <span class="tx-amount" style="color:${tx.type === 'income' ? '#2DCC8F' : '#FF5E5E'}">${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}</span>
  </div>`).join('')}
  ${txs.length > 20 ? `<p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);font-family:'DM Sans',sans-serif;margin-top:12px">... e mais ${txs.length - 20} transações</p>` : ''}
</div>` : ''}

<div class="footer">
  <p>Relatório gerado pelo Grana · ${MONTHS[month-1]} ${year}</p>
  <p style="margin-top:4px">grana-app.vercel.app</p>
</div>

</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
