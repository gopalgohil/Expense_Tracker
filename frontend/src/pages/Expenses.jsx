import { useState, useEffect, useRef, useCallback } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import DateRangeSelector from '../components/DateRangeSelector'
import SearchFilterBar from '../components/SearchFilterBar'
import ExportButtons from '../components/ExportButtons'
import ExpenseCard from '../components/ExpenseCard'
import ExpenseForm from '../components/ExpenseForm'
import Pagination from '../components/Pagination'
import ScaleModal from '../components/animations/ScaleModal'
import { HoverButton } from '../components/animations/HoverButton'
import FadeInSection from '../components/animations/FadeInSection'
import { AnimatedList, ListItem } from '../components/animations/AnimatedList'
import { ExpenseListSkeleton } from '../components/animations/SkeletonLoader'
import toast from 'react-hot-toast'

const CATEGORIES = [
  '', 'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const Expenses = () => {
  const {
    expenses, pagination, loading, error,
    fetchExpenses, addExpense, editExpense, removeExpense
  } = useExpenses()

  // Filter & Search states
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  // Date range states
  const [dateRangeType, setDateRangeType] = useState('monthly')
  const [month, setMonth] = useState(currentMonth())
  const [quarter, setQuarter] = useState({
    year: String(new Date().getFullYear()),
    q: 'Q' + Math.floor((new Date().getMonth() + 3) / 3)
  })
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' })

  // Advanced search/sorting
  const [advanced, setAdvanced] = useState({ sortBy: 'date_desc', minAmount: '', maxAmount: '' })

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Helper to construct query params
  const buildParams = useCallback(() => {
    const params = {
      page,
      limit: 4,
      sortBy: advanced.sortBy,
    }
    if (search) params.search = search
    if (category) params.category = category
    if (advanced.minAmount) params.minAmount = advanced.minAmount
    if (advanced.maxAmount) params.maxAmount = advanced.maxAmount

    if (dateRangeType === 'monthly') {
      params.month = month
    } else if (dateRangeType === 'quarterly') {
      // Backend expects "YYYY-Q#" format e.g. "2026-Q2"
      params.quarter = `${quarter.year}-${quarter.q}`
    } else if (dateRangeType === 'yearly') {
      params.year = year
    } else if (dateRangeType === 'custom') {
      if (customRange.startDate) params.startDate = customRange.startDate
      if (customRange.endDate) params.endDate = customRange.endDate
    } else if (dateRangeType === 'all') {
      params.allTime = 'true'
    }
    return params
  }, [page, search, category, dateRangeType, month, quarter, year, customRange, advanced])

  // Trigger reload on filter changes
  useEffect(() => {
    fetchExpenses(buildParams())
  }, [buildParams])

  useEffect(() => {
    const handleUpdate = () => fetchExpenses(buildParams())
    window.addEventListener('expense-updated', handleUpdate)
    return () => window.removeEventListener('expense-updated', handleUpdate)
  }, [fetchExpenses, buildParams])

  const handleResetFilters = () => {
    setSearch('')
    setCategory('')
    setPage(1)
    setDateRangeType('monthly')
    setMonth(currentMonth())
    setQuarter({
      year: String(new Date().getFullYear()),
      q: 'Q' + Math.floor((new Date().getMonth() + 3) / 3)
    })
    setYear(String(new Date().getFullYear()))
    setCustomRange({ startDate: '', endDate: '' })
    setAdvanced({ sortBy: 'date_desc', minAmount: '', maxAmount: '' })
  }

  // Handle Create/Edit Submit
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
      fetchExpenses(buildParams())
    } else {
      toast.error(res.message || 'Operation failed')
    }
    return res
  }

  // Trigger Edit Modal
  const handleEditClick = (expense) => {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  // Trigger Delete Modal
  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense)
    setShowDeleteConfirm(true)
  }

  // Perform deletion
  const confirmDelete = async () => {
    if (!expenseToDelete) return
    const res = await removeExpense(expenseToDelete._id)
    setShowDeleteConfirm(false)
    setExpenseToDelete(null)

    if (res.success) {
      toast.success('Expense deleted successfully')
      fetchExpenses(buildParams())
    } else {
      toast.error(res.message || 'Failed to delete expense')
    }
  }

  // Filters bundle to pass to ExportButtons
  const exportFilters = {
    category,
    dateRangeType,
    month,
    quarter,
    year,
    customRange
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <FadeInSection>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-zinc-200">All Expenses</h2>
            <p className="text-sm text-ink-400 mt-0.5">Filter, search, and export your transaction history</p>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Date Range & Category Selectors */}
      <FadeInSection delay={0.05}>
        <div className="card p-5 space-y-4">
          <DateRangeSelector
            dateRangeType={dateRangeType}
            onDateRangeTypeChange={(type) => { setDateRangeType(type); setPage(1) }}
            month={month}
            onMonthChange={(m) => { setMonth(m); setPage(1) }}
            quarter={quarter}
            onQuarterChange={(q) => { setQuarter(q); setPage(1) }}
            year={year}
            onYearChange={(y) => { setYear(y); setPage(1) }}
            customRange={customRange}
            onCustomRangeChange={(r) => { setCustomRange(r); setPage(1) }}
          />

          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-ink-100 dark:border-zinc-800">
            <div className="flex-1 min-w-[150px]">
              <label className="label">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1) }}
                className="input-field bg-white dark:bg-zinc-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c || 'All categories'}</option>
                ))}
              </select>
            </div>
            <div>
              <HoverButton onClick={handleResetFilters} className="btn-ghost text-sm py-2.5">
                Reset filters
              </HoverButton>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Search & Sort Panel */}
      <FadeInSection delay={0.1}>
        <SearchFilterBar
          search={search}
          onSearchChange={(s) => { setSearch(s); setPage(1) }}
          advanced={advanced}
          onAdvancedChange={(adv) => { setAdvanced((p) => ({ ...p, ...adv })); setPage(1) }}
          onReset={handleResetFilters}
        />
      </FadeInSection>

      {/* Expense list or error/skeleton state */}
      {loading ? (
        <ExpenseListSkeleton count={6} />
      ) : error ? (
        <FadeInSection>
          <div className="card p-8 text-center">
            <p className="text-coral text-sm font-medium">{error}</p>
            <HoverButton onClick={() => fetchExpenses(buildParams())} className="btn-ghost mt-3 text-sm">
              Try again
            </HoverButton>
          </div>
        </FadeInSection>
      ) : expenses.length === 0 ? (
        <FadeInSection>
          <div className="card p-12 text-center border border-dashed border-ink-200">
            <div className="w-12 h-12 bg-sage-light dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-ink-600 dark:text-zinc-300 font-medium">No expenses found</p>
            <p className="text-ink-400 dark:text-zinc-500 text-sm mt-1">
              Try adjusting your date filters, category choice, or search keywords.
            </p>
          </div>
        </FadeInSection>
      ) : (
        <FadeInSection delay={0.15}>
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

          <Pagination
            pagination={pagination}
            onPageChange={(p) => setPage(p)}
          />
        </FadeInSection>
      )}

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
            Are you sure you want to delete the expense of <span className="font-semibold text-ink-700 dark:text-zinc-350">₹{expenseToDelete?.amount?.toLocaleString('en-IN')}</span> for "{expenseToDelete?.category}"? This action cannot be undone.
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

export default Expenses
