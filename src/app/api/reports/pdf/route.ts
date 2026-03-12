// src/app/api/reports/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// Mapa local de categorias (igual ao frontend)
const CAT_MAP: Record<string, { name: string; icon: string; color: string }> = {
  cat_alimentacao: { name: 'Alimentação',  icon: '🍕', color: '#F5A623' },
  cat_transporte:  { name: 'Transporte',   icon: '🚗', color: '#5B8DEF' },
  cat_moradia:     { name: 'Moradia',      icon: '🏠', color: '#9B59B6' },
  cat_saude:       { name: 'Saúde',        icon: '💊', color: '#2DCC8F' },
  cat_lazer:       { name: 'Lazer',        icon: '🎮', color: '#E91E8C' },
  cat_educacao:    { name: 'Educação',     icon: '📚', color: '#00BCD4' },
  cat_assinaturas: { name: 'Assinaturas',  icon: '📱', color: '#818CF8' },
  cat_salario:     { name: 'Salário',      icon: '💼', color: '#2DCC8F' },
  cat_freelance:   { name: 'Freelance',    icon: '💻', color: '#2DCC8F' },
  cat_outros_gast: { name: 'Outros',       icon: '📦', color: '#6B7280' },
}

function getCat(categoryId: string | null | undefined) {
  if (!categoryId) return { name: 'Outros', icon: '📦', color: '#6B7280' }
  return CAT_MAP[categoryId] ?? { name: categoryId, icon: '📦', color: '#6B7280' }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient(token)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startDate = `${year}-${String(month).padStart(2,'0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [profileRes, txRes, goalsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('transactions').select('id, type, amount, description, date, category_id').eq('user_id', user.id).gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active'),
  ])

  const profile = profileRes.data
  const txs = txRes.data ?? []
  const goals = goalsRes.data ?? []

  const totalIncome = txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + (t.amount ?? 0), 0)
  const totalExpense = txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount ?? 0), 0)
  const balance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

  // Por categoria (usando mapa local)
  const byCategory: Record<string, { name: string, icon: string, color: string, total: number }> = {}
  txs.filter((t: any) => t.type === 'expense').forEach((t: any) => {
    const key = t.category_id || 'cat_outros_gast'
    const catInfo = getCat(t.category_id)
    if (!byCategory[key]) byCategory[key] = { ...catInfo, total: 0 }
    byCategory[key].total += t.amount ?? 0
  })
  const topCategories = Object.values(byCategory).sort((a, b) => b.total - a.total).slice(0, 6)

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  // Calcular score
  let score = 50
  if (savingsRate >= 20) score += 20
  else if (savingsRate >= 10) score += 10
  else if (savingsRate < 0) score -= 20
  if (balance >= 0) score += 10
  if (goals.length > 0) score += 10
  score = Math.max(0, Math.min(100, score))

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório Grana - ${MONTHS[month-1]} ${year}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', Arial, sans-serif;
    background: #ffffff;
    color: #1a1a2e;
    font-size: 13px;
    line-height: 1.5;
  }
  
  .page {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 48px;
  }
  
  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 36px;
    padding-bottom: 24px;
    border-bottom: 2px solid #f0f0f5;
  }
  .logo-wrap { display: flex; align-items: center; gap: 12px; }
  .logo-box {
    width: 44px; height: 44px;
    background: #16a37a;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800; color: white;
    font-style: italic; font-family: Georgia, serif;
  }
  .logo-name { font-size: 24px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.5px; }
  .header-right { text-align: right; }
  .header-title { font-size: 18px; font-weight: 700; color: #1a1a2e; }
  .header-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
  
  /* SCORE BADGE */
  .score-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 6px;
  }
  .score-green { background: #d1fae5; color: #065f46; }
  .score-yellow { background: #fef3c7; color: #92400e; }
  .score-red { background: #fee2e2; color: #991b1b; }
  
  /* KPI GRID */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }
  .kpi-card {
    background: #f8f9fc;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 18px 20px;
  }
  .kpi-label {
    font-size: 10px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 6px;
  }
  .kpi-value {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .kpi-sub {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 3px;
  }
  .c-green { color: #059669; }
  .c-red { color: #dc2626; }
  .c-blue { color: #2563eb; }
  .c-yellow { color: #d97706; }
  .c-gray { color: #6b7280; }
  
  /* SECTION */
  .section {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 22px 24px;
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 18px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  /* CATEGORY ROW */
  .cat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #f9fafb;
  }
  .cat-row:last-child { border-bottom: none; }
  .cat-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
    background: #f3f4f6;
  }
  .cat-name { flex: 1; font-size: 13px; font-weight: 500; color: #374151; }
  .cat-bar-wrap { flex: 2; height: 6px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
  .cat-bar { height: 100%; border-radius: 999px; }
  .cat-pct { font-size: 11px; color: #9ca3af; min-width: 30px; text-align: right; }
  .cat-amount { font-size: 13px; font-weight: 700; color: #dc2626; min-width: 90px; text-align: right; }
  
  /* TRANSACTION ROW */
  .tx-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid #f9fafb;
  }
  .tx-row:last-child { border-bottom: none; }
  .tx-date { font-size: 11px; color: #9ca3af; min-width: 64px; }
  .tx-icon { font-size: 16px; flex-shrink: 0; }
  .tx-info { flex: 1; min-width: 0; }
  .tx-desc { font-size: 13px; font-weight: 500; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tx-cat { font-size: 11px; color: #9ca3af; }
  .tx-card { font-size: 10px; color: #7c3aed; font-weight: 600; background: #ede9fe; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-top: 2px; }
  .tx-amount { font-size: 13px; font-weight: 700; min-width: 90px; text-align: right; }
  
  /* GOALS */
  .goal-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f9fafb;
  }
  .goal-row:last-child { border-bottom: none; }
  .goal-info { flex: 1; }
  .goal-title { font-size: 13px; font-weight: 600; color: #374151; }
  .goal-bar-wrap { flex: 2; height: 6px; background: #f3f4f6; border-radius: 999px; overflow: hidden; margin-top: 6px; }
  .goal-bar { height: 100%; background: #059669; border-radius: 999px; }
  .goal-amount { font-size: 12px; color: #059669; font-weight: 600; min-width: 120px; text-align: right; }
  
  /* BUDGET */
  .budget-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #f9fafb;
  }
  .budget-row:last-child { border-bottom: none; }
  
  /* FOOTER */
  .footer {
    text-align: center;
    margin-top: 36px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f5;
    font-size: 11px;
    color: #9ca3af;
  }
  
  /* MORE PAGES */
  .page-break { page-break-before: always; }
  
  @media print {
    body { background: white; }
    .page { padding: 20px 28px; }
    .section { border: 1px solid #e5e7eb; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-wrap">
      <div class="logo-box">G</div>
      <span class="logo-name">Grana</span>
    </div>
    <div class="header-right">
      <div class="header-title">Relatório Financeiro</div>
      <div class="header-sub">${MONTHS[month-1]} de ${year} · ${profile?.name ?? ''}</div>
      <div class="score-badge ${score >= 80 ? 'score-green' : score >= 50 ? 'score-yellow' : 'score-red'}">
        ${score >= 80 ? '🏆' : score >= 50 ? '👍' : '⚠️'} Saúde Financeira: ${score}/100
      </div>
    </div>
  </div>

  <!-- KPIs principais -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Receitas</div>
      <div class="kpi-value c-green">${fmt(totalIncome)}</div>
      <div class="kpi-sub">${txs.filter(t => t.type === 'income').length} entradas</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Gastos</div>
      <div class="kpi-value c-red">${fmt(totalExpense)}</div>
      <div class="kpi-sub">${txs.filter(t => t.type === 'expense').length} saídas</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Saldo do mês</div>
      <div class="kpi-value ${balance >= 0 ? 'c-green' : 'c-red'}">${fmt(balance)}</div>
      <div class="kpi-sub">${balance >= 0 ? 'No positivo ✓' : 'Atenção!'}</div>
    </div>
  </div>
  
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Taxa de Poupança</div>
      <div class="kpi-value ${savingsRate >= 20 ? 'c-green' : savingsRate >= 10 ? 'c-yellow' : 'c-red'}">${savingsRate.toFixed(1)}%</div>
      <div class="kpi-sub">${savingsRate >= 20 ? 'Meta atingida!' : savingsRate >= 10 ? 'Em progresso' : 'Abaixo do ideal'}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total de Transações</div>
      <div class="kpi-value c-blue">${txs.length}</div>
      <div class="kpi-sub">em ${MONTHS[month-1]}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Metas Ativas</div>
      <div class="kpi-value c-blue">${goals.length}</div>
      <div class="kpi-sub">${goals.length > 0 ? 'Em andamento' : 'Nenhuma meta'}</div>
    </div>
  </div>

  ${topCategories.length > 0 ? `
  <!-- CATEGORIAS -->
  <div class="section">
    <div class="section-title">🗂️ Gastos por Categoria</div>
    ${topCategories.map(cat => `
    <div class="cat-row">
      <div class="cat-icon">${cat.icon}</div>
      <div class="cat-name">${cat.name}</div>
      <div class="cat-bar-wrap">
        <div class="cat-bar" style="width:${Math.min(100, totalExpense > 0 ? (cat.total/totalExpense)*100 : 0).toFixed(0)}%;background:${cat.color}"></div>
      </div>
      <div class="cat-pct">${totalExpense > 0 ? ((cat.total/totalExpense)*100).toFixed(0) : 0}%</div>
      <div class="cat-amount">${fmt(cat.total)}</div>
    </div>`).join('')}
  </div>` : ''}

  ${goals.length > 0 ? `
  <!-- METAS -->
  <div class="section">
    <div class="section-title">🎯 Metas em Andamento</div>
    ${goals.map((g: any) => {
      const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
      return `
    <div class="goal-row">
      <div style="font-size:20px;flex-shrink:0">${g.icon}</div>
      <div class="goal-info">
        <div class="goal-title">${g.title}</div>
        <div class="goal-bar-wrap">
          <div class="goal-bar" style="width:${pct.toFixed(0)}%"></div>
        </div>
      </div>
      <div class="goal-amount">${fmt(g.current_amount)} <span style="color:#9ca3af;font-weight:400">/ ${fmt(g.target_amount)}</span></div>
    </div>`}).join('')}
  </div>` : ''}



  ${txs.length > 0 ? `
  <!-- TRANSAÇÕES -->
  <div class="section">
    <div class="section-title">📋 Transações do Mês (${txs.length})</div>
    ${txs.slice(0, 25).map((tx: any) => {
      const cat = getCat(tx.category_id)
      return `
    <div class="tx-row">
      <div class="tx-date">${new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
      <div class="tx-icon">${cat.icon}</div>
      <div class="tx-info">
        <div class="tx-desc">${tx.description}</div>
        <div class="tx-cat">${cat.name}</div>
      </div>
      <div class="tx-amount" style="color:${tx.type === 'income' ? '#059669' : '#dc2626'}">${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount ?? 0)}</div>
    </div>`}).join('')}
    ${txs.length > 25 ? `<p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:14px;padding-top:10px;border-top:1px solid #f3f4f6">... e mais ${txs.length - 25} transações</p>` : ''}
  </div>` : ''}

  <!-- FOOTER -->
  <div class="footer">
    <p><strong>Grana</strong> — Seu dinheiro organizado &nbsp;·&nbsp; grana-app.vercel.app</p>
    <p style="margin-top:4px">Relatório gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  </div>

</div>
</body>
</html>`

  const filename = `relatorio-grana-${MONTHS[month-1].toLowerCase()}-${year}.html`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
