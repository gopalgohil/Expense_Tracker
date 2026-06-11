import { useState } from 'react'
import ExpenseForm from './ExpenseForm'

const COLORS = {
  'Food & Dining': 'bg-amber-soft text-amber-strong',
  'Transport':     'bg-blue-50 text-blue-600',
  'Shopping':      'bg-purple-50 text-purple-600',
  'Entertainment': 'bg-pink-50 text-pink-600',
  'Health':        'bg-green-50 text-green-600',
  'Utilities':     'bg-orange-50 text-orange-600',
  'Housing':       'bg-indigo-50 text-indigo-600',
  'Education':     'bg-cyan-50 text-cyan-600',
  'Travel':        'bg-teal-50 text-teal-600',
  'Other':         'bg-ink-50 text-ink-500',
}

const INTERVAL_LABEL = {
  monthly: 'Monthly',
  weekly:  'Weekly',
  yearly:  'Yearly',
}

const fmt = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const [editing,   setEditing]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [stopping,  setStopping]  = useState(false)

  const handleEdit = async (formData) => {
    setSaving(true)
    const result = await onEdit(expense._id, formData)
    setSaving(false)
    if (result.success) setEditing(false)
    return result
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(expense._id)
  }

  // Stop recurrence — sends isRecurring: false
  const handleStopRecurring = async () => {
    setStopping(true)
    await onEdit(expense._id, {
      amount:      expense.amount,
      category:    expense.category,
      date:        expense.date.split('T')[0],
      description: expense.description,
      isRecurring: false,
    })
    setStopping(false)
  }

  if (editing) {
    return (
      <div className="card p-4">
        <p className="label mb-3">Edit expense</p>
        <ExpenseForm
          initialData={expense}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
          loading={saving}
        />
      </div>
    )
  }

  return (
    <div className={`card p-4 hover:shadow-lift transition-shadow duration-200
      ${expense.isRecurring ? 'border-l-4 border-l-sage' : ''}`}>
      <div className="flex items-start justify-between gap-4">

        {/* Left side */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0
            ${COLORS[expense.category] || COLORS['Other']}`}>
            {expense.category}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-ink-600 truncate">
                {expense.description || <span className="text-ink-300 italic">No note</span>}
              </p>
              {/* Recurring badge */}
              {expense.isRecurring && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5
                  bg-sage-light text-sage rounded-full whitespace-nowrap flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {INTERVAL_LABEL[expense.recurrenceInterval] || 'Recurring'}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-400 mt-0.5">{fmt(expense.date)}</p>
            {/* Next due date */}
            {expense.isRecurring && expense.nextDueDate && (
              <p className="text-xs text-sage mt-0.5">
                Next: {fmt(expense.nextDueDate)}
              </p>
            )}
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono font-semibold text-ink-800 text-sm">
            ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>

          {/* Stop recurrence button */}
          {expense.isRecurring && (
            <button onClick={handleStopRecurring} disabled={stopping}
              className="p-1.5 text-ink-400 hover:text-amber-strong hover:bg-amber-soft rounded-lg transition-colors disabled:opacity-50"
              title="Stop recurring">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Edit */}
          <button onClick={() => setEditing(true)}
            className="p-1.5 text-ink-400 hover:text-sage hover:bg-sage-light rounded-lg transition-colors"
            title="Edit">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete */}
          <button onClick={handleDelete} disabled={deleting}
            className="p-1.5 text-ink-400 hover:text-coral hover:bg-coral-soft rounded-lg transition-colors disabled:opacity-50"
            title="Delete">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExpenseCard
