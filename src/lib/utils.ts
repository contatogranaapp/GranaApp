// src/lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Tailwind class merger ──────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Formatação de moeda ────────────────────────────────────────
export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// ── Formatação de datas ────────────────────────────────────────
export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatMonth(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMMM yyyy', { locale: ptBR })
}

export function getMonthRange(year: number, month: number) {
  const date = new Date(year, month - 1, 1)
  return {
    start: startOfMonth(date).toISOString().split('T')[0],
    end: endOfMonth(date).toISOString().split('T')[0],
  }
}

// ── Cálculos financeiros ───────────────────────────────────────
export function calcSavingsRate(income: number, expense: number): number {
  if (income === 0) return 0
  return Math.max(0, ((income - expense) / income) * 100)
}

export function calcMonthsToGoal(remaining: number, monthlyTarget: number): number {
  if (monthlyTarget <= 0) return Infinity
  return Math.ceil(remaining / monthlyTarget)
}

export function calcProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

// ── Categorização automática ───────────────────────────────────
const KEYWORD_MAP: Record<string, string[]> = {
  cat_alimentacao: ['mercado', 'supermercado', 'ifood', 'rappi', 'restaurante', 'lanche', 'padaria', 'açougue', 'pão de açúcar', 'carrefour', 'extra', 'atacadão', 'pizza', 'hamburguer', 'sushi', 'delivery', 'mcdonalds', 'burger king', 'subway'],
  cat_transporte: ['uber', '99', 'taxi', 'posto', 'gasolina', 'combustível', 'etanol', 'metrô', 'metro', 'ônibus', 'onibus', 'estacionamento', 'pedágio', 'pedagio', 'shell', 'ipiranga', 'petrobras'],
  cat_moradia: ['aluguel', 'condominio', 'condomínio', 'água', 'luz', 'energia', 'internet', 'net', 'claro', 'vivo', 'tim', 'gás', 'gas', 'iptu'],
  cat_saude: ['farmácia', 'farmacia', 'drogaria', 'ultrafarma', 'droga raia', 'médico', 'medico', 'hospital', 'exame', 'dentista', 'plano de saúde', 'unimed', 'amil', 'academia', 'smart fit'],
  cat_lazer: ['netflix', 'spotify', 'hbo', 'disney', 'amazon prime', 'cinema', 'ingresso', 'viagem', 'hotel', 'airbnb', 'bar', 'balada', 'steam'],
  cat_educacao: ['curso', 'faculdade', 'universidade', 'livro', 'escola', 'udemy', 'alura', 'coursera', 'mensalidade'],
  cat_assinaturas: ['netflix', 'spotify', 'prime', 'adobe', 'microsoft', 'apple', 'google one', 'dropbox', 'notion', 'canva', 'chatgpt'],
  cat_salario: ['salário', 'salario', 'pagamento', 'holerite', 'pro labore'],
  cat_freelance: ['freelance', 'projeto', 'consultoria', 'serviço', 'honorário'],
}

export function detectCategory(description: string): string {
  const text = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  let best = { id: 'cat_outros_gast', score: 0 }

  for (const [categoryId, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      const nkw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (text.includes(nkw) && nkw.length > best.score) {
        best = { id: categoryId, score: nkw.length }
      }
    }
  }
  return best.id
}

// ── Misc ───────────────────────────────────────────────────────
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '...' : str
}
