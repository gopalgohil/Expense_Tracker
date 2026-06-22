import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import ExpenseForm from './ExpenseForm'
import { HoverIcon, HoverButton } from './animations/HoverButton'
import ScaleModal from './animations/ScaleModal'

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

const ExpenseCard = ({ expense, onEdit, onUpdate, onDelete, isNew = false }) => {
  const [deleting,         setDeleting]         = useState(false)
  const [stopping,         setStopping]         = useState(false)
  const [showStopConfirm,  setShowStopConfirm]  = useState(false)
  const [highlight,        setHighlight]        = useState(isNew)

  useEffect(() => {
    if (!isNew) return undefined
    setHighlight(true)
    const t = setTimeout(() => setHighlight(false), 3000)
    return () => clearTimeout(t)
  }, [isNew, expense._id])

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(expense)
    setDeleting(false)
  }

  const handleStopRecurring = () => setShowStopConfirm(true)

  const confirmStopRecurring = async () => {
    setStopping(true)
    const result = await onUpdate(expense._id, {
      amount:      expense.amount,
      category:    expense.category,
      date:        expense.date.split('T')[0],
      description: expense.description,
      isRecurring: false,
    })
    setStopping(false)
    setShowStopConfirm(false)
    if (result.success) toast.success('Recurrence stopped')
  }

  return (
    <>
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
            ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

          <HoverIcon onClick={() => onEdit(expense)}
            className="p-1.5 text-ink-400 hover:text-sage hover:bg-sage-light rounded-lg transition-colors"
            title="Edit">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </HoverIcon>

          <HoverIcon onClick={handleDelete} disabled={deleting}
            className="p-1.5 text-ink-400 hover:text-coral hover:bg-coral-soft rounded-lg transition-colors disabled:opacity-50"
            title="Delete">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </HoverIcon>
        </div>
      </div>
    </motion.div>

      {/* Stop Recurring Confirmation Modal */}
      <ScaleModal
        open={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        maxWidth="max-w-sm"
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-soft flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-strong" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink-800 dark:text-zinc-200 mb-2">
            Stop Recurring?
          </h3>
          <p className="text-sm text-ink-400 dark:text-zinc-500 leading-relaxed mb-1">
            This will stop the automatic recurrence for
          </p>
          <p className="text-sm font-semibold text-ink-700 dark:text-zinc-300 mb-1">
            {expense.category}
          </p>
          <p className="text-sm text-ink-400 dark:text-zinc-500 leading-relaxed mb-6">
            <span className="font-mono font-semibold text-ink-700 dark:text-zinc-300">
              ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {' '}· {INTERVAL_LABEL[expense.recurrenceInterval] || 'Recurring'}
            <br />The existing expense will remain. No future entries will be created.
          </p>
          <div className="flex flex-col gap-2">
            <HoverButton
              onClick={confirmStopRecurring}
              disabled={stopping}
              className="w-full py-2.5 rounded-xl bg-amber-strong text-white font-semibold text-sm
                hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stopping ? 'Stopping…' : 'Yes, Stop Recurring'}
            </HoverButton>
            <HoverButton
              onClick={() => setShowStopConfirm(false)}
              disabled={stopping}
              className="w-full py-2.5 rounded-xl bg-ink-50 dark:bg-zinc-800 text-ink-600
                dark:text-zinc-400 font-medium text-sm hover:bg-ink-100 dark:hover:bg-zinc-750
                transition-colors disabled:opacity-50"
            >
              Cancel
            </HoverButton>
          </div>
        </div>
      </ScaleModal>
    </>
  )
}

export default ExpenseCard
