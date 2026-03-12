// src/types/index.ts

export type Plan = 'free' | 'pro'
export type TransactionType = 'expense' | 'income' | 'transfer'
export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'
export type MessageRole = 'user' | 'assistant'
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type TransactionSource = 'manual' | 'ai_chat' | 'csv_import' | 'api'

export interface Profile {
  id: string
  name: string
  email: string
  monthly_income: number
  plan: Plan
  stripe_customer_id?: string
  stripe_subscription_id?: string
  currency: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  color: string
  icon: string
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  user_id?: string | null
  name: string
  icon: string
  color: string
  type: 'expense' | 'income' | 'both'
  keywords: string[]
  budget_limit?: number | null
}

export interface Transaction {
  id: string
  user_id: string
  account_id?: string | null
  category_id?: string | null
  // Joins
  category?: Category | null
  account?: Account | null
  type: TransactionType
  amount: number
  description: string
  notes?: string | null
  date: string
  is_installment: boolean
  installment_current?: number | null
  installment_total?: number | null
  installment_group_id?: string | null
  is_recurring: boolean
  recurring_interval?: RecurringInterval | null
  source: TransactionSource
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string | null
  icon: string
  target_amount: number
  current_amount: number
  deadline?: string | null
  monthly_target?: number | null
  status: GoalStatus
  created_at: string
  updated_at: string
  // Calculados no front
  progress_percent?: number
  months_remaining?: number
}

export interface ChatMessage {
  id: string
  user_id: string
  role: MessageRole
  content: string
  tokens_used?: number | null
  action_taken?: string | null
  action_data?: Record<string, unknown> | null
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  category?: Category
  month: number
  year: number
  limit_amount: number
  // Calculados
  spent?: number
  percent?: number
}

// ── Tipos de API ───────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

export interface MonthlySummary {
  year: number
  month: number
  total_income: number
  total_expense: number
  balance: number
  savings_rate: number
  by_category: CategorySummary[]
}

export interface CategorySummary {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  type: 'expense' | 'income'
  total: number
  transaction_count: number
  percent_of_total: number
  vs_last_month?: number  // percentual de variação
}

// ── Tipos para IA ──────────────────────────────────────────────

export type AIActionType =
  | 'create_transaction'
  | 'create_goal'
  | 'show_report'
  | 'show_balance'
  | 'show_tips'
  | 'none'

export interface AIAction {
  type: AIActionType
  data?: Partial<Transaction> | Partial<Goal> | Record<string, unknown>
  success?: boolean
}
