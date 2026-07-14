import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useExpenses } from '../hooks/useExpenses'
import { useBudgets } from '../hooks/useBudgets'
import { useAnalytics } from '../hooks/useAnalytics'
import ExpenseCard from '../components/ExpenseCard'
import ExpenseForm from '../components/ExpenseForm'
import StatsBar from '../components/StatsBar'
import BudgetProgress from '../components/BudgetProgress'
import SummaryCards from '../components/SummaryCards'
import DailyBarChart from '../components/DailyBarChart'
import MonthCompareChart from '../components/MonthCompareChart'
import ScaleModal from '../components/animations/ScaleModal'
import { HoverButton } from '../components/animations/HoverButton'
import FadeInSection from '../components/animations/FadeInSection'
import { AnimatedList, ListItem } from '../components/animations/AnimatedList'
import ExportButtons from '../components/ExportButtons'
import {
  SummaryCardsSkeleton,
  StatsBarSkeleton,
  ChartSkeleton,
  ExpenseListSkeleton,
  BudgetSkeleton,
} from '../components/animations/SkeletonLoader'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
}

const formatCurrency = (amount, currency) => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency || '₹';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol}${Number(amount).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [month, setMonth] = useState(currentMonth())

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // API Hooks
  const {
    expenses, loading: expensesLoading, error: expensesError,
    fetchExpenses, addExpense, editExpense, removeExpense
  } = useExpenses()
  const { status, loading: budgetsLoading, fetchBudgets } = useBudgets()
  const { summary, topCats, dailyData, loading: analyticsLoading, error: analyticsError, fetchAnalytics } = useAnalytics()

  // Fetch recent 3 expenses, budget status, and analytics for the chosen month
  const refreshAllData = useCallback(() => {
    fetchExpenses({ month, page: 1, limit: 3, sortBy: 'date_desc' })
    fetchBudgets(month)
    fetchAnalytics(month)
  }, [month, fetchExpenses, fetchBudgets, fetchAnalytics])

  useEffect(() => {
    refreshAllData()
  }, [refreshAllData])

  useEffect(() => {
    const handleUpdate = () => refreshAllData()
    window.addEventListener('expense-updated', handleUpdate)
    return () => window.removeEventListener('expense-updated', handleUpdate)
  }, [refreshAllData])

  // Track budget notifications using sessionStorage to persist across page refreshes
  useEffect(() => {
    if (!status.length) return

    let notifiedSet = new Set()
    try {
      const stored = sessionStorage.getItem('notified_budgets')
      if (stored) {
        notifiedSet = new Set(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to parse budget notifications from session storage', e)
    }

    let updated = false
    status.forEach((item) => {
      const cacheKey = `${month}-${item.category}`
      if (item.percent >= 90 && !notifiedSet.has(cacheKey)) {
        notifiedSet.add(cacheKey)
        updated = true
        const over = item.percent >= 100
        toast(
          over
            ? `🚨 ${item.category} is over budget! (${item.percent}%)`
            : `⚠️ ${item.category} is at ${item.percent}% of budget`,
          {
            id: `budget-${item.category}-${month}`,
            style: {
              background: over ? '#fee2e2' : '#fef9c3',
              color: over ? '#b91c1c' : '#92400e',
              border: `1px solid ${over ? '#fca5a5' : '#fde68a'}`,
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
            },
            duration: 5000,
          }
        )
      }
    })

    if (updated) {
      try {
        sessionStorage.setItem('notified_budgets', JSON.stringify([...notifiedSet]))
      } catch (e) {
        console.error('Failed to save budget notifications to session storage', e)
      }
    }
  }, [status, month])

  // Add / Edit submission
  const handleFormSubmit = async (payload) => {
    setFormLoading(true)
    let res
    if (editingExpense) {
      res = await editExpense(editingExpense._id, payload)
    } else {
      res = await addExpense(payload)
    }
    setFormLoading(false)

    if (res.success) {
      toast.success(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!')
      setIsFormOpen(false)
      setEditingExpense(null)
      refreshAllData()
    } else {
      toast.error(res.message || 'Operation failed')
    }
    return res
  }

  const handleEditClick = (expense) => {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!expenseToDelete) return
    const res = await removeExpense(expenseToDelete._id)
    setShowDeleteConfirm(false)
    setExpenseToDelete(null)

    if (res.success) {
      toast.success('Expense deleted successfully')
      refreshAllData()
    } else {
      toast.error(res.message || 'Failed to delete expense')
    }
  }

  const exportFilters = {
    dateRangeType: 'monthly',
    month: month,
  }

  const chartKey = `${month}`
  const isDataLoading = expensesLoading || budgetsLoading || analyticsLoading

  return (
    <div className="space-y-5">
      {/* Header section */}
      <FadeInSection>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-zinc-200">Dashboard</h2>
            <p className="text-sm text-ink-400 mt-0.5">Track and manage your spending</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Month picker */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-ink-150 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-sm">
              <span className="text-xs font-semibold text-ink-500">Month:</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border-0 bg-transparent text-sm font-semibold text-ink-700 dark:text-zinc-300 focus:ring-0 cursor-pointer p-0"
                max={currentMonth()}
              />
            </div>

            <ExportButtons filters={exportFilters} />

            <HoverButton
              onClick={() => {
                setEditingExpense(null)
                setIsFormOpen(true)
              }}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add expense
            </HoverButton>
          </div>
        </div>
      </FadeInSection>

      {/* Summary Cards */}
      {isDataLoading && !summary ? (
        <SummaryCardsSkeleton />
      ) : analyticsError ? (
        <FadeInSection>
          <div className="card p-6 text-center flex flex-col items-center justify-center border border-dashed border-ink-200">
            <p className="text-sm text-coral-strong font-medium flex items-center gap-2">
              Failed to load analytics: {analyticsError}
            </p>
            <HoverButton onClick={refreshAllData} className="btn-ghost mt-3 text-xs py-1.5 px-4">
              Try again
            </HoverButton>
          </div>
        </FadeInSection>
      ) : (
        <FadeInSection delay={0.05}>
          <SummaryCards summary={summary} topCats={topCats} />
        </FadeInSection>
      )}

      {/* Stats Bar */}
      {isDataLoading && !expenses.length ? (
        <StatsBarSkeleton />
      ) : expenses.length > 0 ? (
        <FadeInSection delay={0.1}>
          <StatsBar expenses={expenses} />
        </FadeInSection>
      ) : null}

      {/* Budgets Progress */}
      {isDataLoading && status.length === 0 ? (
        <BudgetSkeleton />
      ) : status.length > 0 ? (
        <FadeInSection delay={0.15}>
          <BudgetProgress status={status} />
        </FadeInSection>
      ) : null}

      {/* Trend Charts */}
      {(dailyData.length > 0 || summary) && !analyticsError && (
        <FadeInSection delay={0.2}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {isDataLoading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : (
              <>
                <DailyBarChart data={dailyData} chartKey={chartKey} />
                <MonthCompareChart summary={summary} chartKey={chartKey} />
              </>
            )}
          </div>
        </FadeInSection>
      )}

      {/* Recent Expenses List */}
      <div className="space-y-3">
        <FadeInSection delay={0.25}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink-800 dark:text-zinc-200">Recent Transactions</h3>
            <HoverButton
              onClick={() => navigate('/expenses')}
              className="text-xs text-sage font-semibold hover:text-sage-dark flex items-center gap-1 transition-colors"
            >
              See more
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </HoverButton>
          </div>
        </FadeInSection>

        {isDataLoading && expenses.length === 0 ? (
          <ExpenseListSkeleton count={3} />
        ) : expensesError ? (
          <div className="card p-6 text-center text-coral text-sm font-medium">{expensesError}</div>
        ) : expenses.length === 0 ? (
          <FadeInSection delay={0.3}>
            <div className="card p-8 text-center border border-dashed border-ink-200">
              <p className="text-ink-500 dark:text-zinc-400 text-sm">No recent transactions for {month}.</p>
              <HoverButton
                onClick={() => {
                  setEditingExpense(null)
                  setIsFormOpen(true)
                }}
                className="btn-ghost mt-3 text-xs"
              >
                Add first expense
              </HoverButton>
            </div>
          </FadeInSection>
        ) : (
          <FadeInSection delay={0.3}>
            <AnimatedList className="space-y-2.5">
              {expenses.map((expense, idx) => (
                <ListItem key={expense._id} index={idx}>
                  <ExpenseCard
                    expense={expense}
                    onEdit={handleEditClick}
                    onUpdate={editExpense}
                    onDelete={handleDeleteClick}
                  />
                </ListItem>
              ))}
            </AnimatedList>
          </FadeInSection>
        )}
      </div>

      {/* Add / Edit Modal */}
      <ScaleModal
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingExpense(null) }}
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink-100 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-ink-800 dark:text-zinc-200">
              {editingExpense ? '✏️ Edit Expense' : '➕ Add Expense'}
            </h3>
            <button
              onClick={() => { setIsFormOpen(false); setEditingExpense(null) }}
              className="p-1 rounded-lg text-ink-400 hover:text-ink-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ExpenseForm
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingExpense(null) }}
            initialData={editingExpense}
            loading={formLoading}
          />
        </div>
      </ScaleModal>

      {/* Delete Confirmation Modal */}
      <ScaleModal
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setExpenseToDelete(null) }}
        maxWidth="max-w-sm"
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-coral-soft dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink-800 dark:text-zinc-200 mb-2">Delete Expense?</h3>
          <p className="text-sm text-ink-400 dark:text-zinc-500 mb-6 leading-relaxed">
            Are you sure you want to delete the expense of <span className="font-semibold text-ink-700 dark:text-zinc-350">{formatCurrency(expenseToDelete?.amount || 0, expenseToDelete?.currency || 'INR')}</span> for "{expenseToDelete?.category}"? This action cannot be undone.
          </p>
          <div className="flex flex-col gap-2">
            <HoverButton
              onClick={confirmDelete}
              className="w-full py-2.5 rounded-xl bg-coral text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Delete
            </HoverButton>
            <HoverButton
              onClick={() => { setShowDeleteConfirm(false); setExpenseToDelete(null) }}
              className="w-full py-2.5 rounded-xl bg-ink-50 dark:bg-zinc-800 text-ink-600 dark:text-zinc-400 font-medium text-sm hover:bg-ink-100 dark:hover:bg-zinc-750 transition-colors"
            >
              Cancel
            </HoverButton>
          </div>
        </div>
      </ScaleModal>
    </div>
  )
}

export default Dashboard
