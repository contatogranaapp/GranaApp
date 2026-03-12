'use client'
// src/hooks/useGoals.ts

import { useState, useEffect, useCallback } from 'react'
import type { Goal } from '@/types'

export function useGoals(status = 'active') {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/goals?status=${status}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setGoals(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar metas')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const addGoal = async (data: Partial<Goal>) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    await fetchGoals()
    return json.data
  }

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    const res = await fetch(`/api/goals?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...json.data } : g))
    return json.data
  }

  return { goals, loading, error, refetch: fetchGoals, addGoal, updateGoal }
}
