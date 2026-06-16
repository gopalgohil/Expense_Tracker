import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { useBudgets } from '../hooks/useBudgets'
import { useCurrency } from '../hooks/useCurrency'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const BudgetSettings = () => {
  const { currencySymbol, formatMoney } = useCurrency()
  const navigate                                        = useNavigate()
  const { budgets, loading, fetchBudgets, saveBudget, removeBudget } = useBudgets()
  const [month,   setMonth]   = useState(currentMonth())
  const [form,    setForm]    = useState({ category: '', limit: '' })
  const [saving,  setSaving]  = useState(false)

  useEffect(() => { fetchBudgets(month) }, [month])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.category || !form.limit) { toast.error('Select a category and enter a limit'); return }
    if (Number(form.limit) <= 0)        { toast.error('Limit must be greater than 0'); return }
    setSaving(true)
    const result = await saveBudget(month, form.category, Number(form.limit))
    setSaving(false)
    if (result.success) {
      toast.success(`Budget saved for ${form.category}`)
      setForm({ category: '', limit: '' })
      fetchBudgets(month)
    } else {
      toast.error(result.message)
    }
  }

  const handleDelete = async (id, category) => {
    const result = await removeBudget(id)
    if (result.success) toast.success(`Budget removed for ${category}`)
    else toast.error(result.message)
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl hover:bg-ink-100 text-ink-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-ink-800">Budget Settings</h2>
            <p className="text-sm text-ink-400">Set monthly limits per category</p>
          </div>
        </div>

        {/* Month picker */}
        <div className="card p-4">
          <label className="label">Select Month</label>
          <input
            type="month" value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-field max-w-[180px]"
          />
        </div>

        {/* Add / Edit form */}
        <div className="card p-5">
          <p className="label mb-4">Set budget limit</p>
          <form onSubmit={handleSave} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="input-field bg-white" required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="label">Monthly limit ({currencySymbol})</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-mono text-sm">{currencySymbol}</span>
                <input
                  type="number" min="1" step="1" placeholder="0"
                  value={form.limit}
                  onChange={(e) => setForm((p) => ({ ...p, limit: e.target.value }))}
                  className="input-field pl-8 font-mono" required
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary whitespace-nowrap">
              {saving ? 'Saving…' : 'Save Budget'}
            </button>
          </form>
        </div>

        {/* Existing budgets list */}
        <div className="card p-5">
          <p className="label mb-4">Budgets for {month}</p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-10 bg-ink-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-6">
              No budgets set for this month yet.
            </p>
          ) : (
            <div className="space-y-2">
              {budgets.map((b) => (
                <div key={b._id}
                  className="flex items-center justify-between bg-ink-50 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-ink-700">{b.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-ink-800">
                      {formatMoney(b.limit, 0)}
                    </span>
                    <button
                      onClick={() => handleDelete(b._id, b.category)}
                      className="p-1.5 text-ink-400 hover:text-coral hover:bg-coral-soft rounded-lg transition-colors"
                      title="Remove budget"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default BudgetSettings
