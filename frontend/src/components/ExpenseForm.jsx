import { useState, useEffect } from 'react'
import { useCurrency } from '../hooks/useCurrency'

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
  const { currencySymbol } = useCurrency()
  const [form, setForm] = useState({
    amount: '', category: '', date: today(), description: '',
    isRecurring: false, recurrenceInterval: 'monthly',
  })
  const [error, setError] = useState('')

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
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.category || !form.date) {
      setError('Please fill in all required fields.'); return
    }
    if (Number(form.amount) <= 0) {
      setError('Amount must be greater than zero.'); return
    }
    if (form.isRecurring && !form.recurrenceInterval) {
      setError('Please select a recurrence interval.'); return
    }

    const payload = {
      amount:             form.amount,
      category:           form.category,
      date:               form.date,
      description:        form.description,
      isRecurring:        form.isRecurring,
      recurrenceInterval: form.isRecurring ? form.recurrenceInterval : null,
    }

    const result = await onSubmit(payload)
    if (!result.success) setError(result.message)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-coral-soft text-coral text-sm px-4 py-2.5 rounded-xl">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Amount */}
        <div className="col-span-1">
          <label className="label">Amount ({currencySymbol}) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-mono text-sm">{currencySymbol}</span>
            <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00"
              value={form.amount} onChange={handleChange}
              className="input-field pl-8 font-mono h-14" required />
          </div>
        </div>

        {/* Category */}
        <div className="col-span-1">
          <label className="label">Category *</label>
          <select name="category" value={form.category} onChange={handleChange}
            className="input-field bg-white h-14" required>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Date */}
        <div className="col-span-1">
          <label className="label">Date *</label>
          <input name="date" type="date" value={form.date} onChange={handleChange}
            className="input-field h-14"
            max={maxDate()}
            required />
        </div>

        {/* Note */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <label className="label">Note (optional)</label>
          <input name="description" type="text" placeholder="What was this for?"
            value={form.description} onChange={handleChange}
            className="input-field h-14" maxLength={120} />
        </div>
      </div>

      {/* ── Recurring toggle ── */}
      <div className="border border-ink-100 rounded-xl p-6 space-y-5 bg-ink-50">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox" name="isRecurring"
              checked={form.isRecurring} onChange={handleChange}
              className="sr-only peer"
            />
            {/* Toggle track */}
            <div className="w-10 h-6 bg-ink-200 rounded-full peer-checked:bg-sage transition-colors duration-200" />
            {/* Toggle thumb */}
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
              transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-700">Mark as Recurring</p>
            <p className="text-xs text-ink-400">Auto-add this expense in future periods</p>
          </div>
        </label>

        {/* Interval selector — only when recurring is on */}
        {form.isRecurring && (
          <div>
            <label className="label">Repeat every</label>
            <div className="flex gap-2 flex-wrap">
              {INTERVALS.map((iv) => (
                <label key={iv.value}
                  className={`flex items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer transition-all
                    ${form.recurrenceInterval === iv.value
                      ? 'bg-sage text-white border-sage'
                      : 'bg-white text-ink-600 border-ink-200 hover:border-sage'}`}>
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
      <div className="flex gap-4 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 h-14 text-base">
          {loading ? 'Saving…' : initialData ? 'Save changes' : 'Add expense'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost h-14 text-base flex items-center justify-center">Cancel</button>
      </div>
    </form>
  )
}

export default ExpenseForm
