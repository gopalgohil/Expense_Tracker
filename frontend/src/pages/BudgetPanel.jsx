import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useBudgets } from '../hooks/useBudgets'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const BudgetPanel = ({ month, onMonthChange }) => {
  const { budgets, loading, fetchBudgets, saveBudget, removeBudget } = useBudgets()
  const [form,      setForm]      = useState({ category: '', limit: '' })
  const [editingId, setEditingId] = useState(null)   // null = add mode, id = edit mode
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { fetchBudgets(month) }, [month])

  // Pre-fill form when user clicks Edit
  const handleEdit = (b) => {
    setForm({ category: b.category, limit: String(b.limit) })
    setEditingId(b._id)
    // Scroll form into view on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setForm({ category: '', limit: '' })
    setEditingId(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.category || !form.limit) { toast.error('Select a category and enter a limit'); return }
    if (Number(form.limit) <= 0)       { toast.error('Limit must be greater than 0'); return }

    setSaving(true)
    // saveBudget uses upsert — same call for both add and update
    const result = await saveBudget(month, form.category, Number(form.limit))
    setSaving(false)

    if (result.success) {
      toast.success(editingId ? `Budget updated for ${form.category}` : `Budget saved for ${form.category}`)
      handleCancel()
      fetchBudgets(month)
    } else {
      toast.error(result.message)
    }
  }

  const handleDelete = async (id, category) => {
    // If currently editing this item, reset form
    if (editingId === id) handleCancel()
    const result = await removeBudget(id)
    if (result.success) toast.success(`Budget removed for ${category}`)
    else toast.error(result.message)
  }

  const isEditing = editingId !== null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-ink-800">Budgets</h2>
        <p className="text-sm text-ink-400 mt-1">Set monthly spending limits per category</p>
      </div>

      {/* Month picker */}
      <div className="card p-4">
        <label className="label">Select Month</label>
        <input
          type="month" value={month}
          onChange={(e) => { onMonthChange(e.target.value); handleCancel() }}
          className="input-field max-w-[180px]"
        />
      </div>

      {/* Add / Edit form */}
      <div className={`card p-5 border-2 transition-colors ${isEditing ? 'border-sage' : 'border-transparent'}`}>
        <div className="flex items-center justify-between mb-4">
          <p className="label">
            {isEditing ? `✏️ Editing — ${form.category}` : 'Set budget limit'}
          </p>
          {isEditing && (
            <button onClick={handleCancel}
              className="text-xs text-ink-400 hover:text-ink-700 font-medium transition-colors">
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="label">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="input-field bg-white"
              disabled={isEditing}   // can't change category when editing
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {isEditing && (
              <p className="text-xs text-ink-400 mt-1">Category cannot be changed. Delete and re-add to change.</p>
            )}
          </div>

          <div className="flex-1 min-w-[130px]">
            <label className="label">Monthly limit (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-mono text-sm">₹</span>
              <input
                type="number" min="1" step="1" placeholder="0"
                value={form.limit}
                onChange={(e) => setForm((p) => ({ ...p, limit: e.target.value }))}
                className="input-field pl-8 font-mono"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className={`btn-primary whitespace-nowrap ${isEditing ? 'bg-sage-dark' : ''}`}>
              {saving
                ? 'Saving…'
                : isEditing ? 'Update Budget' : 'Save Budget'}
            </button>
            {isEditing && (
              <button type="button" onClick={handleCancel} className="btn-ghost">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing budgets list */}
      <div className="card p-5">
        <p className="label mb-4">Budgets for {month}</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-ink-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <p className="text-ink-400 text-sm text-center py-8">
            No budgets set for this month yet.
          </p>
        ) : (
          <div className="space-y-2">
            {budgets.map((b) => (
              <div key={b._id}
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors
                  ${editingId === b._id ? 'bg-sage-light border border-sage' : 'bg-ink-50'}`}>
                <span className="text-sm font-medium text-ink-700">{b.category}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-ink-800">
                    ₹{b.limit.toLocaleString('en-IN')}
                  </span>

                  {/* Edit button */}
                  <button
                    onClick={() => handleEdit(b)}
                    className={`p-1.5 rounded-lg transition-colors
                      ${editingId === b._id
                        ? 'text-sage bg-white'
                        : 'text-ink-400 hover:text-sage hover:bg-sage-light'}`}
                    title="Edit budget"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(b._id, b.category)}
                    className="p-1.5 text-ink-400 hover:text-coral hover:bg-coral-soft rounded-lg transition-colors"
                    title="Delete budget"
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
  )
}

export default BudgetPanel
