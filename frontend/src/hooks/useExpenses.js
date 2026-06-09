import { useState, useCallback } from 'react'
import {
  getExpenses as apiGet,
  createExpense as apiCreate,
  updateExpense as apiUpdate,
  deleteExpense as apiDelete,
} from '../api/client'

export const useExpenses = () => {
  const [expenses, setExpenses]         = useState([])
  const [allExpenses, setAllExpenses]   = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)

  const fetchExpenses = useCallback(async (filters = {}) => {
    setLoading(true); setError(null)
    try {
      // Fetch filtered expenses + all-time expenses in parallel
      const [filtered, all] = await Promise.all([
        apiGet(filters),
        apiGet({}),           // no filters → full history for trend chart
      ])
      setExpenses(filtered.data)
      setAllExpenses(all.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenses')
    } finally { setLoading(false) }
  }, [])

  const addExpense = async (expenseData) => {
    try {
      const { data } = await apiCreate(expenseData)
      setExpenses((prev) => [data, ...prev])
      setAllExpenses((prev) => [data, ...prev])
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add expense' }
    }
  }

  const editExpense = async (id, expenseData) => {
    try {
      const { data } = await apiUpdate(id, expenseData)
      setExpenses((prev) => prev.map((e) => (e._id === id ? data : e)))
      setAllExpenses((prev) => prev.map((e) => (e._id === id ? data : e)))
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update expense' }
    }
  }

  const removeExpense = async (id) => {
    try {
      await apiDelete(id)
      setExpenses((prev) => prev.filter((e) => e._id !== id))
      setAllExpenses((prev) => prev.filter((e) => e._id !== id))
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete expense' }
    }
  }

  return { expenses, allExpenses, loading, error, fetchExpenses, addExpense, editExpense, removeExpense }
}
