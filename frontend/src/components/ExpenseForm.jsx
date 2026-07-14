import { useState, useEffect } from 'react'
import { upsertBudget } from '../api/client'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const CURRENCIES = [
  'INR','USD','EUR','GBP','JPY','CAD','AUD','SGD','CHF','NZD',
  'HKD','CNY','MXN','BRL','ZAR','SEK','NOK','DKK','THB','MYR',
]

const INTERVALS = [
  { value: 'monthly', label: '📅 Monthly' },
  { value: 'weekly',  label: '📆 Weekly'  },
  { value: 'yearly',  label: '🗓️ Yearly'  },
]

const today   = () => new Date().toISOString().split('T')[0]
const maxDate = today

/* ── Reusable icon components ── */
const WarningIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
)

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
)

/* ── Overlay backdrop ── */
const Backdrop = ({ children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    {children}
  </div>
)

/* ══════════════════════════════════════════════
   MODAL 1 — Budget Warning (3 options)
══════════════════════════════════════════════ */
const BudgetWarningModal = ({ payload, budgetInfo, onUpdateBudget, onContinue, onCancel, loading }) => {
  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

  return (
    <Backdrop>
      <div
        className="bg-white dark:bg-zinc-900 border border-ink-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        style={{ animation: 'modal-pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <WarningIcon />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-100">Budget Alert</p>
              <h3 className="text-lg font-bold text-white leading-tight">Budget Exceeded</h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-ink-600 dark:text-zinc-400 leading-relaxed">
            This expense exceeds your{' '}
            <span className="font-semibold text-ink-800 dark:text-zinc-200">
              {budgetInfo?.category || payload?.category}
            </span>{' '}
            budget. How would you like to proceed?
          </p>

          {/* Budget info pills */}
          {(budgetInfo?.budgetLimit != null || budgetInfo?.currentSpent != null) && (
            <div className="grid grid-cols-2 gap-2">
              {budgetInfo?.budgetLimit != null && (
                <div className="bg-ink-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-zinc-500 mb-0.5">Budget Limit</p>
                  <p className="text-base font-bold text-ink-800 dark:text-zinc-200">{fmt(budgetInfo.budgetLimit)}</p>
                </div>
              )}
              {payload?.amount != null && (
                <div className="bg-coral-soft/60 dark:bg-red-950/30 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-coral dark:text-red-400 mb-0.5">This Expense</p>
                  <p className="text-base font-bold text-coral dark:text-red-400">{fmt(payload.amount)}</p>
                </div>
              )}
            </div>
          )}

          {/* 3 Action buttons */}
          <div className="space-y-2 pt-1">
            {/* Option 1: Update Budget */}
            <button
              type="button"
              onClick={onUpdateBudget}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-sage/40 hover:border-sage bg-sage/5 hover:bg-sage/10 transition-all duration-150 group text-left"
            >
              <div className="w-8 h-8 bg-sage/15 group-hover:bg-sage/25 rounded-lg flex items-center justify-center text-sage transition-colors flex-shrink-0">
                <EditIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800 dark:text-zinc-200">Update Budget</p>
                <p className="text-xs text-ink-400 dark:text-zinc-500">Increase the budget limit, then save</p>
              </div>
            </button>

            {/* Option 2: Continue Anyway */}
            <button
              type="button"
              onClick={onContinue}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-orange-300/50 hover:border-orange-400 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100/60 dark:hover:bg-orange-950/40 transition-all duration-150 group text-left disabled:opacity-60"
            >
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800 dark:text-zinc-200">
                  {loading ? 'Saving…' : 'Continue Anyway'}
                </p>
                <p className="text-xs text-ink-400 dark:text-zinc-500">Add expense and mark as over budget</p>
              </div>
            </button>

            {/* Option 3: Cancel */}
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-ink-500 dark:text-zinc-400 hover:bg-ink-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel — Don't add this expense
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  )
}

/* ══════════════════════════════════════════════
   MODAL 2 — Update Budget Form
══════════════════════════════════════════════ */
const UpdateBudgetModal = ({ payload, budgetInfo, newAmount, onAmountChange, onBack, onSave, saving, error }) => {
  const fmt       = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
  const isValid   = Number(newAmount) > 0
  const isTooLow  = Number(newAmount) > 0 && Number(newAmount) < (payload?.amount || 0)

  return (
    <Backdrop>
      <div
        className="bg-white dark:bg-zinc-900 border border-ink-100 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        style={{ animation: 'modal-pop 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-ink-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-lg hover:bg-ink-100 dark:hover:bg-zinc-800 flex items-center justify-center text-ink-400 dark:text-zinc-500 transition-colors"
            >
              <ArrowLeftIcon />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-zinc-500">
                {budgetInfo?.category || payload?.category}
              </p>
              <h3 className="text-base font-bold text-ink-800 dark:text-zinc-200 leading-tight">Update Budget Limit</h3>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-coral-soft text-coral text-xs px-3.5 py-2.5 rounded-xl border border-coral/10 leading-normal">
              {error}
            </div>
          )}

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-ink-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-zinc-500 mb-0.5">Current Budget</p>
              <p className="text-base font-bold text-ink-800 dark:text-zinc-200">
                {budgetInfo?.budgetLimit != null ? fmt(budgetInfo.budgetLimit) : 'Not set'}
              </p>
            </div>
            <div className="bg-coral-soft/60 dark:bg-red-950/30 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-coral dark:text-red-400 mb-0.5">Expense Amount</p>
              <p className="text-base font-bold text-coral dark:text-red-400">{fmt(payload?.amount)}</p>
            </div>
          </div>

          {/* New budget input */}
          <div>
            <label className="label">New Budget Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 font-mono text-sm pointer-events-none">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Enter new limit"
                value={newAmount}
                onChange={(e) => onAmountChange(e.target.value)}
                className={`input-field pl-8 font-mono bg-white dark:bg-zinc-800 text-ink-800 dark:text-zinc-100 ${
                  isTooLow ? '!border-amber-400 focus:!ring-amber-300/30' : ''
                }`}
                autoFocus
              />
            </div>
            {isTooLow && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                New budget is still lower than this expense (₹{Number(payload?.amount).toLocaleString('en-IN')})
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-2.5 rounded-xl border border-ink-200 dark:border-zinc-700 text-ink-600 dark:text-zinc-300 font-semibold text-sm hover:bg-ink-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!isValid || saving}
              className="flex-1 py-2.5 rounded-xl bg-sage hover:bg-sage-dark text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Saving…
                </>
              ) : 'Save & Add Expense'}
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  )
}


/* ══════════════════════════════════════════════
   MAIN EXPENSE FORM
══════════════════════════════════════════════ */
const ExpenseForm = ({ onSubmit, onCancel, initialData = null, loading = false }) => {
  const { user } = useAuth()
  const baseCur = user?.currency || 'INR'
  const [form, setForm] = useState({
    amount: '', category: '', date: today(), description: '',
    isRecurring: false, recurrenceInterval: 'monthly',
    currency: baseCur,
  })
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')

  /* ── Budget Warning state machine ── */
  // step: null | 'warning' | 'update-budget'
  const [budgetStep,     setBudgetStep]     = useState(null)
  const [pendingPayload, setPendingPayload] = useState(null)
  const [budgetInfo,     setBudgetInfo]     = useState(null)   // { category, budgetLimit, currentSpent }
  const [newBudget,      setNewBudget]      = useState('')
  const [modalLoading,   setModalLoading]   = useState(false)
  const [budgetSaving,   setBudgetSaving]   = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        amount:             initialData.amount || '',
        category:           initialData.category || '',
        date:               initialData.date ? initialData.date.split('T')[0] : today(),
        description:        initialData.description || '',
        isRecurring:        initialData.isRecurring || false,
        recurrenceInterval: initialData.recurrenceInterval || 'monthly',
        currency:           initialData.currency || baseCur,
      })
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    if (name === 'date') {
      setError(value > today() ? 'Expense date cannot be in the future.' : '')
    } else {
      setError('')
    }
  }

  /* ── Form submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.category || !form.date) {
      setError('Please fill in all required fields.'); return
    }
    if (Number(form.amount) <= 0) {
      setError('Amount must be greater than zero.'); return
    }
    if (form.date > today()) {
      setError('Expense date cannot be in the future.'); return
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
      currency:           form.currency || baseCur,
    }

    setError('')
    setModalError('')
    setModalLoading(true)
    const result = await onSubmit(payload)
    setModalLoading(false)

    if (!result.success) {
      if (result.exceedsBudget) {
        setPendingPayload(payload)
        setBudgetInfo({
          category:    result.category    || payload.category,
          budgetLimit: result.budgetLimit  ?? null,
          currentSpent:result.currentSpent ?? null,
          month:       payload.date.slice(0, 7),
        })
        setBudgetStep('warning')
      } else {
        setError(result.message)
      }
    }
  }

  /* ── Option 1: Update Budget → open step 2 ── */
  const handleUpdateBudgetClick = () => {
    setNewBudget(budgetInfo?.budgetLimit != null ? String(budgetInfo.budgetLimit) : '')
    setModalError('')
    setBudgetStep('update-budget')
  }

  /* ── Option 1 save: save new budget then add expense ── */
  const handleSaveBudgetAndContinue = async () => {
    if (!pendingPayload || Number(newBudget) <= 0) return
    setBudgetSaving(true)
    setModalError('')
    try {
      await upsertBudget({
        month:    budgetInfo.month,
        category: budgetInfo.category,
        limit:    Number(newBudget),
      })
      const result = await onSubmit({ ...pendingPayload, bypassBudget: true })
      if (!result.success) {
        setModalError(result.message)
        setBudgetSaving(false)
        return
      }

      // Success path -> close modals & clean up
      setBudgetStep(null)
      setPendingPayload(null)
      setBudgetInfo(null)
      setNewBudget('')
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update budget. Please try again.'
      setModalError(errMsg)
    } finally {
      setBudgetSaving(false)
    }
  }

  /* ── Option 2: Continue Anyway ── */
  const handleContinueAnyway = async () => {
    if (!pendingPayload) return
    setModalError('')
    setModalLoading(true)
    const result = await onSubmit({ ...pendingPayload, bypassBudget: true })
    setModalLoading(false)
    if (!result.success) {
      setError(result.message)
    } else {
      setBudgetStep(null)
      setPendingPayload(null)
      setBudgetInfo(null)
    }
  }

  /* ── Option 3: Cancel ── */
  const handleCancelModal = () => {
    setBudgetStep(null)
    setPendingPayload(null)
    setBudgetInfo(null)
    setNewBudget('')
    setModalError('')
  }

  return (
    <>
      {/* ── keyframe injected once ── */}
      <style>{`
        @keyframes modal-pop {
          from { opacity:0; transform:scale(0.88) translateY(8px); }
          to   { opacity:1; transform:scale(1)    translateY(0);   }
        }
      `}</style>

      {/* ════ MAIN FORM ════ */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-coral-soft text-coral text-sm px-4 py-2.5 rounded-xl">{error}</div>
        )}

        {/* Amount + Currency */}
        <div>
          <label className="label">Amount *</label>
          <div className="flex gap-2">
            <select
              name="currency"
              value={form.currency}
              onChange={handleChange}
              className="input-field w-24 font-mono text-sm bg-white dark:bg-zinc-800 text-ink-800 dark:text-zinc-100 flex-shrink-0"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00"
              value={form.amount} onChange={handleChange}
              className="input-field flex-1 font-mono bg-white dark:bg-zinc-800 text-ink-800 dark:text-zinc-100" required />
          </div>
          {form.currency !== baseCur && (
            <p className="text-xs text-ink-400 mt-1">Will be converted to {baseCur} for totals & budgets.</p>
          )}
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
            max={maxDate()} required />
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

        {/* Recurring toggle */}
        <div className="border border-ink-100 dark:border-zinc-800 rounded-xl p-4 space-y-3 bg-ink-50 dark:bg-zinc-800/40">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" name="isRecurring"
                checked={form.isRecurring} onChange={handleChange}
                className="sr-only peer" />
              <div className="w-10 h-6 bg-ink-200 dark:bg-zinc-700 rounded-full peer-checked:bg-sage dark:peer-checked:bg-emerald-600 transition-colors duration-200" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-700 dark:text-zinc-300">Mark as Recurring</p>
              <p className="text-xs text-ink-400 dark:text-zinc-500">Auto-add this expense in future periods</p>
            </div>
          </label>

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
                    <input type="radio" name="recurrenceInterval"
                      value={iv.value} checked={form.recurrenceInterval === iv.value}
                      onChange={handleChange} className="sr-only" />
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

      {/* ════ MODAL 1: Budget Warning ════ */}
      {budgetStep === 'warning' && pendingPayload && (
        <BudgetWarningModal
          payload={pendingPayload}
          budgetInfo={budgetInfo}
          onUpdateBudget={handleUpdateBudgetClick}
          onContinue={handleContinueAnyway}
          onCancel={handleCancelModal}
          loading={modalLoading}
        />
      )}

      {/* ════ MODAL 2: Update Budget ════ */}
      {budgetStep === 'update-budget' && pendingPayload && (
        <UpdateBudgetModal
          payload={pendingPayload}
          budgetInfo={budgetInfo}
          newAmount={newBudget}
          onAmountChange={setNewBudget}
          onBack={() => {
            setModalError('')
            setBudgetStep('warning')
          }}
          onSave={handleSaveBudgetAndContinue}
          saving={budgetSaving}
          error={modalError}
        />
      )}
    </>
  )
}

export default ExpenseForm
