import { useState, useEffect } from 'react'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const INTERVALS = [
  { value: 'monthly', label: '📅 Monthly' },
  { value: 'weekly',  label: '📆 Weekly'  },
  { value: 'yearly',  label: '🗓️ Yearly'  },
]

const today = () => new Date().toISOString().split('T')[0]

// Max date allowed = today (no future dates)
const maxDate = today

const ExpenseForm = ({ onSubmit, onCancel, initialData = null, loading = false }) => {
  const [form, setForm] = useState({
    amount: '', category: '', date: today(), description: '',
    isRecurring: false, recurrenceInterval: 'monthly',
  })
  const [error, setError] = useState('')

  // Budget Warning Modal State
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        amount:             initialData.amount || '',
        category:           initialData.category || '',
        date:               initialData.date ? initialData.date.split('T')[0] : today(),
        description:        initialData.description || '',
        isRecurring:        initialData.isRecurring || false,
        recurrenceInterval: initialData.recurrenceInterval || 'monthly',
      })
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))

    // Live date validation — clear error on other fields, set it immediately for date
    if (name === 'date') {
      if (value > today()) {
        setError('Expense date cannot be in the future. Please select today or an earlier date.')
      } else {
        setError('')
      }
    } else {
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.category || !form.date) {
      setError('Please fill in all required fields.'); return
    }
    if (Number(form.amount) <= 0) {
      setError('Amount must be greater than zero.'); return
    }
    if (form.date > today()) {
      setError('Expense date cannot be in the future. Please select today or an earlier date.'); return
    }
    if (form.isRecurring && !form.recurrenceInterval) {
      setError('Please select a recurrence interval.'); return
    }

    const payload = {
      amount:             Number(form.amount),
      category:           form.category,
      date:               form.date,
      description:        form.description,
      isRecurring:        form.isRecurring,
      recurrenceInterval: form.isRecurring ? form.recurrenceInterval : null,
    }

    setError('')
    setModalLoading(true)
    const result = await onSubmit(payload)
    setModalLoading(false)

    if (!result.success) {
      if (result.exceedsBudget) {
        setPendingPayload(payload)
        setShowWarningModal(true)
      } else {
        setError(result.message)
      }
    }
  }

  const handleBypassSave = async () => {
    if (!pendingPayload) return
    setShowWarningModal(false)
    setModalLoading(true)
    setError('')

    const result = await onSubmit({ ...pendingPayload, bypassBudget: true })
    setModalLoading(false)

    if (!result.success) {
      setError(result.message)
    }
    setPendingPayload(null)
  }

  const handleCancelModal = () => {
    setShowWarningModal(false)
    setPendingPayload(null)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-coral-soft text-coral text-sm px-4 py-2.5 rounded-xl">{error}</div>
        )}

        {/* Amount */}
        <div>
          <label className="label">Amount (₹) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-mono text-sm">₹</span>
            <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00"
              value={form.amount} onChange={handleChange}
              className="input-field pl-8 font-mono bg-white dark:bg-zinc-800 text-ink-800 dark:text-zinc-100" required />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="label">Category *</label>
          <select name="category" value={form.category} onChange={handleChange}
            className="input-field bg-white dark:bg-zinc-800 text-ink-800 dark:text-zinc-100" required>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="label">Date *</label>
          <input name="date" type="date" value={form.date} onChange={handleChange}
            className={`input-field bg-white dark:bg-zinc-800 text-ink-800 dark:text-zinc-100 ${form.date > today() ? 'border-coral ring-1 ring-coral/40' : ''}`}
            max={maxDate()}
            required />
          {form.date > today() ? (
            <p className="mt-1 text-xs font-medium text-coral flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              Future dates are not allowed.
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-400 dark:text-zinc-500">Today or any past date.</p>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="label">Note (optional)</label>
          <input name="description" type="text" placeholder="What was this for?"
            value={form.description} onChange={handleChange}
            className="input-field bg-white dark:bg-zinc-800 text-ink-800 dark:text-zinc-100" maxLength={120} />
        </div>

        {/* ── Recurring toggle ── */}
        <div className="border border-ink-100 dark:border-zinc-800 rounded-xl p-4 space-y-3 bg-ink-50 dark:bg-zinc-800/40">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox" name="isRecurring"
                checked={form.isRecurring} onChange={handleChange}
                className="sr-only peer"
              />
              {/* Toggle track */}
              <div className="w-10 h-6 bg-ink-200 dark:bg-zinc-700 rounded-full peer-checked:bg-sage dark:peer-checked:bg-emerald-600 transition-colors duration-200" />
              {/* Toggle thumb */}
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-700 dark:text-zinc-300">Mark as Recurring</p>
              <p className="text-xs text-ink-400 dark:text-zinc-500">Auto-add this expense in future periods</p>
            </div>
          </label>

          {/* Interval selector — only when recurring is on */}
          {form.isRecurring && (
            <div>
              <label className="label">Repeat every</label>
              <div className="flex gap-2 flex-wrap">
                {INTERVALS.map((iv) => (
                  <label key={iv.value}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer transition-all
                      ${form.recurrenceInterval === iv.value
                        ? 'bg-sage dark:bg-emerald-600 text-white border-sage dark:border-emerald-600'
                        : 'bg-white dark:bg-zinc-800 text-ink-600 dark:text-zinc-300 border-ink-200 dark:border-zinc-700 hover:border-sage'}`}>
                    <input
                      type="radio" name="recurrenceInterval"
                      value={iv.value} checked={form.recurrenceInterval === iv.value}
                      onChange={handleChange} className="sr-only"
                    />
                    {iv.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading || modalLoading} className="btn-primary flex-1">
            {loading || modalLoading ? 'Saving…' : initialData ? 'Save changes' : 'Add expense'}
          </button>
          <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        </div>
      </form>

      {/* ── Budget Warning Popup ── */}
      {showWarningModal && pendingPayload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-ink-100 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-up space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-coral-soft/50 dark:bg-coral/20 flex items-center justify-center text-coral shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink-800 dark:text-zinc-200">Budget Warning</h3>
                <p className="text-sm text-ink-600 dark:text-zinc-400">
                  This expense exceeds your budget limit. Do you want to continue?
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleBypassSave}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-coral hover:bg-red-600 text-white shadow-sm transition-colors text-center animate-pulse-subtle"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={handleCancelModal}
                className="flex-1 py-2.5 rounded-xl border border-ink-200 dark:border-zinc-700 text-ink-600 dark:text-zinc-300 font-semibold text-sm hover:bg-ink-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ExpenseForm
