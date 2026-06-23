import { useState, useCallback, useRef } from 'react'
import {
  getExpenses as apiGet,
  createExpense as apiCreate,
  updateExpense as apiUpdate,
  deleteExpense as apiDelete,
} from '../api/client'

export const useExpenses = () => {
  const [expenses,    setExpenses]    = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, limit: 5, totalPages: 1 })
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  // Holds the AbortController for the current in-flight filtered fetch
  const abortRef = useRef(null)

  const fetchExpenses = useCallback(async (filters = {}) => {
    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setLoading(true); setError(null)
    try {
      const res = await apiGet(filters, signal)
      const data = res.data

      if (data?.expenses) {
        setExpenses(data.expenses)
        setAllExpenses(data.expenses)
        setPagination(data.pagination)
      } else {
        setExpenses(data)
        setAllExpenses(data)
      }

    } catch (err) {
      // Ignore abort errors — they are expected when a newer request cancels this one
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return
      setError(err.response?.data?.message || 'Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }, [])

  const addExpense = async (expenseData) => {
    try {
      const { data } = await apiCreate(expenseData)
      setExpenses((prev) => [data, ...prev])
      setAllExpenses((prev) => [data, ...prev])
      setPagination((p) => ({ ...p, total: p.total + 1 }))
      return { success: true, data }
    } catch (err) {
      const d = err.response?.data || {}
      return {
        success:      false,
        message:      d.message      || 'Failed to add expense',
        exceedsBudget:d.exceedsBudget|| false,
        budgetLimit:  d.budgetLimit  ?? null,
        currentSpent: d.currentSpent ?? null,
        category:     d.category     || null,
      }
    }
  }

  const editExpense = async (id, expenseData) => {
    try {
      const { data } = await apiUpdate(id, expenseData)
      setExpenses((prev) => prev.map((e) => (e._id === id ? data : e)))
      setAllExpenses((prev) => prev.map((e) => (e._id === id ? data : e)))
      return { success: true, data }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update expense',
        exceedsBudget: err.response?.data?.exceedsBudget,
      }
    }
  }

  const removeExpense = async (id) => {
    const deleted = expenses.find((e) => e._id === id) || allExpenses.find((e) => e._id === id)
    try {
      await apiDelete(id)
      setExpenses((prev) => prev.filter((e) => e._id !== id))
      setAllExpenses((prev) => prev.filter((e) => e._id !== id))
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }))
      return { success: true, deleted }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete expense' }
    }
  }

  const restoreExpense = async (expense) => {
    if (!expense) return { success: false, message: 'Nothing to restore' }
    const { _id, __v, createdAt, updatedAt, ...payload } = expense
    try {
      const { data } = await apiCreate(payload)
      setExpenses((prev) => [data, ...prev])
      setAllExpenses((prev) => [data, ...prev])
      setPagination((p) => ({ ...p, total: p.total + 1 }))
      return { success: true, data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to restore expense' }
    }
  }

  return {
    expenses, allExpenses, pagination,
    loading, error,
    fetchExpenses, addExpense, editExpense, removeExpense, restoreExpense,
  }
}
