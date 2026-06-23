import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useBudgets } from '../hooks/useBudgets'
import Pagination from '../components/Pagination'
import ScaleModal from '../components/animations/ScaleModal'
import { HoverButton } from '../components/animations/HoverButton'

const LIMIT = 4

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

// Always returns "YYYY-MM" for the current month
const currentMonthStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const BudgetPanel = ({ month, onMonthChange }) => {
  const { budgets, loading, fetchBudgets, saveBudget, removeBudget } = useBudgets()
  const [form,      setForm]      = useState({ category: '', limit: '' })
  const [editingId, setEditingId] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [page,      setPage]      = useState(1)

  // Delete confirmation modal
  const [deleteTarget,    setDeleteTarget]    = useState(null)
  const [confirmDeleting, setConfirmDeleting] = useState(false)

  // True when the currently selected month is before the current month
  const isPastMonth = month < currentMonthStr()

  // Reset to page 1 whenever the month changes or the budget list length changes
  useEffect(() => { setPage(1) }, [month])
  useEffect(() => { setPage(1) }, [budgets.length])

  useEffect(() => { fetchBudgets(month) }, [month])

  // ── Derived pagination values (client-side slice) ──────────────────────
  const total      = budgets.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const safePage   = Math.min(page, totalPages)
  const pagedBudgets = budgets.slice((safePage - 1) * LIMIT, safePage * LIMIT)

  const pagination = { page: safePage, totalPages, total, limit: LIMIT }

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

  // Guard: reject past-month selection at the picker level
  const handleMonthChange = (value) => {
    if (value < currentMonthStr()) {
      toast.error('Budgets can only be set for the current month and future months.')
      return
    }
    onMonthChange(value)
    handleCancel()
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.category || !form.limit) { toast.error('Select a category and enter a limit'); return }
    if (Number(form.limit) <= 0)       { toast.error('Limit must be greater than 0'); return }
    if (Number(form.limit) > 10000000) { toast.error('Budget limit cannot exceed ₹10,000,000'); return }

    // Double-check: guard against any programmatic/manual bypass
    if (isPastMonth) {
      toast.error('Budgets cannot be created or edited for past months.')
      return
    }

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

  const handleDelete = (b) => {
    // If currently editing this item, reset form
    if (editingId === b._id) handleCancel()
    setDeleteTarget(b)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setConfirmDeleting(true)
    const result = await removeBudget(deleteTarget._id)
    setConfirmDeleting(false)
    setDeleteTarget(null)
    if (result.success) toast.success(`Budget removed for ${deleteTarget.category}`)
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
      <div className="card p-4 space-y-2">
        <label className="label">Select Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="input-field max-w-[180px]"
          min={currentMonthStr()}
        />
        <p className="text-xs text-ink-400 dark:text-zinc-500">
          Only the current month and future months are available for budget management.
        </p>
      </div>

      {/* Past-month warning banner — shown if user navigates here via URL or programmatic change */}
      {isPastMonth && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20 px-4 py-3">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
            You are viewing a past month (<strong>{month}</strong>). Budgets cannot be created or edited for past months.
            Switch to the current month or a future month to make changes.
          </p>
        </div>
      )}

      {/* Add / Edit form — locked when viewing a past month */}
      <div className={`card p-5 border-2 transition-colors
        ${isPastMonth ? 'opacity-50 pointer-events-none border-transparent' : ''}
        ${isEditing && !isPastMonth ? 'border-sage' : !isPastMonth ? 'border-transparent' : ''}`}
      >
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

        <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="w-full sm:flex-1 sm:min-w-[150px]">
            <label className="label">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="input-field bg-white w-full"
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

          <div className="w-full sm:flex-1 sm:min-w-[130px]">
            <label className="label">Monthly limit (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-mono text-sm">₹</span>
              <input
                type="number" min="1" step="1" placeholder="0"
                value={form.limit}
                onChange={(e) => setForm((p) => ({ ...p, limit: e.target.value }))}
                className="input-field pl-8 font-mono w-full"
                required
              />
            </div>
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            <button type="submit" disabled={saving || isPastMonth}
              className={`flex-1 sm:flex-none btn-primary whitespace-nowrap ${isEditing ? 'bg-sage-dark' : ''}`}>
              {saving ? 'Saving…' : isEditing ? 'Update Budget' : 'Save Budget'}
            </button>
            {isEditing && (
              <button type="button" onClick={handleCancel} className="btn-ghost flex-1 sm:flex-none">
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
          <>
            <div className="space-y-2">
              {pagedBudgets.map((b) => (
                <div key={b._id}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors
                    ${editingId === b._id ? 'bg-sage-light border border-sage' : 'bg-ink-50'}`}>
                  <span className="text-sm font-medium text-ink-700">{b.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-ink-800">
                      ₹{b.limit.toLocaleString('en-IN')}
                    </span>

                    {/* Edit — disabled for past months */}
                    <button
                      onClick={() => handleEdit(b)}
                      disabled={isPastMonth}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                        ${editingId === b._id
                          ? 'text-sage bg-white'
                          : 'text-ink-400 hover:text-sage hover:bg-sage-light'}`}
                      title={isPastMonth ? 'Cannot edit budgets for past months' : 'Edit budget'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(b)}
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

            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              itemLabel="budgets"
            />
          </>
        )}
      </div>

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <ScaleModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="max-w-sm"
      >
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-coral-soft dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-ink-800 dark:text-zinc-200 mb-2">
            Delete Budget?
          </h3>

          {/* Body */}
          <p className="text-sm text-ink-400 dark:text-zinc-500 mb-1 leading-relaxed">
            Are you sure you want to remove the budget for
          </p>
          <p className="text-sm font-semibold text-ink-700 dark:text-zinc-300 mb-1">
            {deleteTarget?.category}
          </p>
          <p className="text-sm text-ink-400 dark:text-zinc-500 mb-6 leading-relaxed">
            Limit:{' '}
            <span className="font-semibold text-ink-700 dark:text-zinc-300 font-mono">
              ₹{deleteTarget?.limit?.toLocaleString('en-IN')}
            </span>
            {' '}for <span className="font-semibold text-ink-700 dark:text-zinc-300">{month}</span>.
            <br />This action cannot be undone.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <HoverButton
              onClick={confirmDelete}
              disabled={confirmDeleting}
              className="w-full py-2.5 rounded-xl bg-coral text-white font-semibold text-sm
                hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmDeleting ? 'Deleting…' : 'Yes, Delete'}
            </HoverButton>
            <HoverButton
              onClick={() => setDeleteTarget(null)}
              disabled={confirmDeleting}
              className="w-full py-2.5 rounded-xl bg-ink-50 dark:bg-zinc-800 text-ink-600
                dark:text-zinc-400 font-medium text-sm hover:bg-ink-100 dark:hover:bg-zinc-750
                transition-colors disabled:opacity-50"
            >
              Cancel
            </HoverButton>
          </div>
        </div>
      </ScaleModal>
    </div>
  )
}

export default BudgetPanel
