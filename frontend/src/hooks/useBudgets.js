import { useState, useCallback } from 'react'
import {
  getBudgets      as apiGetBudgets,
  getBudgetStatus as apiGetStatus,
  upsertBudget    as apiUpsert,
  deleteBudget    as apiDelete,
} from '../api/client'

export const useBudgets = () => {
  const [budgets, setBudgets]   = useState([])
  const [status,  setStatus]    = useState([])   // spent vs limit per category
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState(null)

  const fetchBudgets = useCallback(async (month) => {
    setLoading(true); setError(null)
    try {
      const [b, s] = await Promise.all([
        apiGetBudgets({ month }),
        apiGetStatus({ month }),
      ])
      setBudgets(b.data)
      setStatus(s.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch budgets')
    } finally { setLoading(false) }
  }, [])

  const saveBudget = async (month, category, limit) => {
    try {
      const { data } = await apiUpsert({ month, category, limit })
      setBudgets((prev) => {
        const exists = prev.find((b) => b.category === category)
        return exists
          ? prev.map((b) => (b.category === category ? data : b))
          : [...prev, data]
      })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to save budget' }
    }
  }

  const removeBudget = async (id) => {
    try {
      await apiDelete(id)
      setBudgets((prev) => prev.filter((b) => b._id !== id))
      setStatus((prev)  => prev.filter((s) => s._id !== id))
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete budget' }
    }
  }

  // Refresh only the status (called after adding an expense)
  const refreshStatus = useCallback(async (month) => {
    try {
      const { data } = await apiGetStatus({ month })
      setStatus(data)
    } catch (_) {}
  }, [])

  return { budgets, status, loading, error, fetchBudgets, saveBudget, removeBudget, refreshStatus }
}
