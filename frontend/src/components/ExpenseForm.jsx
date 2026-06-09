import { useState, useEffect } from 'react'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const today = () => new Date().toISOString().split('T')[0]

const ExpenseForm = ({ onSubmit, onCancel, initialData = null, loading = false }) => {
  const [form, setForm]   = useState({ amount: '', category: '', date: today(), description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setForm({
        amount:      initialData.amount || '',
        category:    initialData.category || '',
        date:        initialData.date ? initialData.date.split('T')[0] : today(),
        description: initialData.description || '',
      })
    }
  }, [initialData])

  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.category || !form.date) { setError('Please fill in all required fields.'); return }
    if (Number(form.amount) <= 0) { setError('Amount must be greater than zero.'); return }
    const result = await onSubmit(form)
    if (!result.success) setError(result.message)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-coral-soft text-coral text-sm px-4 py-2.5 rounded-xl">{error}</div>}

      <div>
        <label className="label">Amount (₹) *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-mono text-sm">₹</span>
          <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00"
            value={form.amount} onChange={handleChange} className="input-field pl-8 font-mono" required />
        </div>
      </div>

      <div>
        <label className="label">Category *</label>
        <select name="category" value={form.category} onChange={handleChange} className="input-field bg-white" required>
          <option value="">Select category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Date *</label>
        <input name="date" type="date" value={form.date} onChange={handleChange} className="input-field" required />
      </div>

      <div>
        <label className="label">Note (optional)</label>
        <input name="description" type="text" placeholder="What was this for?"
          value={form.description} onChange={handleChange} className="input-field" maxLength={120} />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving…' : initialData ? 'Save changes' : 'Add expense'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  )
}

export default ExpenseForm
