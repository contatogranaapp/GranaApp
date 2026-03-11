'use client'
// src/hooks/useTransactions.ts

import { useState, useEffect, useCallback } from 'react'
import type { Transaction } from '@/types'

interface UseTransactionsOptions {
  month?: number
  year?: number
  type?: 'expense' | 'income'
  limit?: number
}

export function useTransactions(opts: UseTransactionsOptions = {}) {
  const now = new Date()
  const {
    month = now.getMonth() + 1,
    year = now.getFullYear(),
    type,
    limit = 20,
  } = opts

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
      limit: String(limit),
    })
    if (type) params.set('type', type)

    try {
      const res = await fetch(`/api/transactions?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTransactions(json.data ?? [])
      setCount(json.count ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }, [month, year, type, limit])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const addTransaction = async (data: Partial<Transaction>) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    await fetchTransactions() // Recarrega a lista
    return json.data
  }

  const deleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
    setTransactions(prev => prev.filter(t => t.id !== id))
    setCount(prev => prev - 1)
  }

  return { transactions, count, loading, error, refetch: fetchTransactions, addTransaction, deleteTransaction }
}
