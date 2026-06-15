import { useState, useCallback } from 'react'
import {
  getExpenses as apiGet,
  createExpense as apiCreate,
  updateExpense as apiUpdate,
  deleteExpense as apiDelete,
} from '../api/client'

export const useExpenses = () => {
  const [expenses,    setExpenses]    = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const fetchExpenses = useCallback(async (filters = {}) => {
    setLoading(true); setError(null)
    try {
      // Filtered fetch (with search, sort, pagination)
      // All-time fetch (no filters, no pagination — for charts)
      const [filteredRes, allRes] = await Promise.all([
        apiGet(filters),
        apiGet({ limit: 9999 }),   // fetch all for charts
      ])

      // New response shape: { expenses, pagination }
      const filteredData = filteredRes.data
      if (filteredData?.expenses) {
        setExpenses(filteredData.expenses)
        setPagination(filteredData.pagination)
      } else {
        // Fallback if old shape
        setExpenses(filteredData)
      }

      const allData = allRes.data
      setAllExpenses(allData?.expenses || allData || [])

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenses')
    } finally { setLoading(false) }
  }, [])

  const addExpense = async (expenseData) => {
    try {
      const { data } = await apiCreate(expenseData)
      setExpenses((prev) => [data, ...prev])
      setAllExpenses((prev) => [data, ...prev])
      setPagination((p) => ({ ...p, total: p.total + 1 }))
      return { success: true, data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add expense' }
    }
  }

  const editExpense = async (id, expenseData) => {
    try {
      const { data } = await apiUpdate(id, expenseData)
      setExpenses((prev) => prev.map((e) => (e._id === id ? data : e)))
      setAllExpenses((prev) => prev.map((e) => (e._id === id ? data : e)))
      return { success: true, data }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update expense' }
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
