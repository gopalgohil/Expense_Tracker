import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import ExpenseForm from './ExpenseForm'
import { HoverIcon, HoverButton } from './animations/HoverButton'
import ScaleModal from './animations/ScaleModal'
import { useCurrency } from '../hooks/useCurrency'

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

const ExpenseCard = ({ expense, onEdit, onDelete, isNew = false }) => {
  const { formatMoney } = useCurrency()
  const [editing,   setEditing]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [stopping,  setStopping]  = useState(false)
  const [highlight, setHighlight] = useState(isNew)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isNew) return undefined
    setHighlight(true)
    const t = setTimeout(() => setHighlight(false), 3000)
    return () => clearTimeout(t)
  }, [isNew, expense._id])

  const handleEdit = async (formData) => {
    setSaving(true)
    const result = await onEdit(expense._id, formData)
    setSaving(false)
    if (result.success) {
      toast.success('Expense updated!')
      setEditing(false)
    } else {
      toast.error(result.message || 'Failed to update expense')
    }
    return result
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(expense._id)
    setDeleting(false)
  }

  const handleStopRecurring = async () => {
    setStopping(true)
    const result = await onEdit(expense._id, {
      amount:      expense.amount,
      category:    expense.category,
      date:        expense.date.split('T')[0],
      description: expense.description,
      isRecurring: false,
    })
    setStopping(false)
    if (result.success) toast.success('Recurrence stopped')
  }

  if (editing) {
    return (
      <>
        <motion.div layout className="card p-4 opacity-50 pointer-events-none">
          <p className="text-sm text-ink-400 italic">Editing…</p>
        </motion.div>
        <ScaleModal open={editing} onClose={() => setEditing(false)} maxWidth="max-w-3xl">
          <div className="p-8 md:p-10">
            <p className="label mb-3">Edit expense</p>
            <ExpenseForm
              initialData={expense}
              onSubmit={handleEdit}
              onCancel={() => setEditing(false)}
              loading={saving}
            />
          </div>
        </ScaleModal>
      </>
    )
  }

  return (
    <motion.div
      layout
      className={`card p-4 transition-all duration-300
        ${expense.isRecurring ? 'border-l-4 border-l-sage' : ''}
        ${highlight ? 'ring-2 ring-green-400/70 bg-green-50/60 dark:bg-green-900/20' : ''}`}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(15,14,12,0.10)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-4">

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
            {expense.isRecurring && expense.nextDueDate && (
              <p className="text-xs text-sage mt-0.5">
                Next: {fmt(expense.nextDueDate)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="font-mono font-semibold text-ink-800 text-sm mr-1">
            {formatMoney(expense.amount)}
          </span>

          {expense.isRecurring && (
            <HoverIcon onClick={handleStopRecurring} disabled={stopping}
              className="p-1.5 text-ink-400 hover:text-amber-strong hover:bg-amber-soft rounded-lg transition-colors disabled:opacity-50"
              title="Stop recurring">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </HoverIcon>
          )}

          <HoverIcon onClick={() => setEditing(true)}
            className="p-1.5 text-ink-400 hover:text-sage hover:bg-sage-light rounded-lg transition-colors"
            title="Edit">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </HoverIcon>

          <HoverIcon onClick={() => setShowConfirmDelete(true)} disabled={deleting}
            className="p-1.5 text-ink-400 hover:text-coral hover:bg-coral-soft rounded-lg transition-colors disabled:opacity-50"
            title="Delete">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </HoverIcon>
        </div>
      </div>

      <ScaleModal open={showConfirmDelete} onClose={() => setShowConfirmDelete(false)} maxWidth="max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-coral-soft dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink-800 mb-2">Delete expense?</h3>
          <p className="text-sm text-ink-400 mb-6 leading-relaxed">
            Are you sure you want to delete this expense? This will permanently remove this record.
          </p>
          <div className="flex flex-col gap-2">
            <HoverButton
              onClick={() => {
                setShowConfirmDelete(false)
                handleDelete()
              }}
              className="w-full py-2.5 rounded-xl bg-coral text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Delete
            </HoverButton>
            <HoverButton
              onClick={() => setShowConfirmDelete(false)}
              className="w-full py-2.5 rounded-xl bg-ink-50 text-ink-600 dark:bg-ink-100/10 dark:text-ink-400 font-medium text-sm hover:bg-ink-100 dark:hover:bg-ink-100/20 transition-colors"
            >
              Cancel
            </HoverButton>
          </div>
        </div>
      </ScaleModal>
    </motion.div>
  )
}


export default ExpenseCard
