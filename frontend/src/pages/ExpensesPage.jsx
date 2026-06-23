import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useExpenses } from '../hooks/useExpenses'
import ExpenseCard from '../components/ExpenseCard'
import ExpenseForm from '../components/ExpenseForm'
import SearchFilterBar from '../components/SearchFilterBar'
import Pagination from '../components/Pagination'
import ScaleModal from '../components/animations/ScaleModal'
import FadeInSection from '../components/animations/FadeInSection'
import { AnimatedList, ListItem } from '../components/animations/AnimatedList'
import { HoverButton } from '../components/animations/HoverButton'
import { ExpenseListSkeleton } from '../components/animations/SkeletonLoader'

const CATEGORIES = [
  '', 'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const DEFAULT_ADVANCED = { minAmount: '', maxAmount: '', sortBy: 'date_desc' }

// ── localStorage persistence helpers ──
const LS_KEY = 'sw_expense_filters'

const loadSavedFilters = () => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

const saveFilters = (tab, filters) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ tab, filters }))
  } catch { /* quota exceeded */ }
}

const ExpensesPage = () => {
  const {
    expenses, pagination, loading, error,
    fetchExpenses, addExpense, editExpense, removeExpense, restoreExpense,
  } = useExpenses()

  // Restore from localStorage or fall back to defaults
  const _saved = loadSavedFilters()

  const [filterTab, setFilterTab] = useState(
    _saved?.tab ?? 'monthly'
  )
  const [filters, setFilters] = useState(
    _saved?.filters ?? {
      month: currentMonth(),
      year: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      category: ''
    }
  )
  const [dateError,  setDateError]  = useState('')
  const [search,     setSearch]     = useState('')
  const [advanced,   setAdvanced]   = useState(DEFAULT_ADVANCED)
  const [page,       setPage]       = useState(1)
  const [pageSize,   setPageSize]   = useState(5)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const validateCustomDates = useCallback((startDate, endDate) => {
    if (filterTab !== 'custom') return ''
    if (!startDate || !endDate) return ''
    if (startDate > endDate) return 'Start date cannot be later than end date.'
    return ''
  }, [filterTab])

  const buildParams = useCallback(() => {
    const p = { category: filters.category, page, limit: pageSize, sortBy: advanced.sortBy }
    
    if (filterTab === 'monthly') {
      p.month = filters.month
    } else if (filterTab === 'yearly') {
      p.year = filters.year
    } else if (filterTab === 'custom') {
      if (filters.startDate) p.startDate = filters.startDate
      if (filters.endDate) p.endDate = filters.endDate
    } else if (filterTab === 'all') {
      p.allTime = 'true'
    }

    if (search)             p.search    = search
    if (advanced.minAmount) p.minAmount = advanced.minAmount
    if (advanced.maxAmount) p.maxAmount = advanced.maxAmount
    return p
  }, [filterTab, filters, search, advanced, page, pageSize])

  useEffect(() => {
    if (filterTab === 'custom') {
      const err = validateCustomDates(filters.startDate, filters.endDate)
      setDateError(err)
      if (err) return
    } else {
      setDateError('')
    }
    fetchExpenses(buildParams())
  }, [filterTab, filters, search, advanced, page, pageSize, fetchExpenses, buildParams, validateCustomDates])

  // Persist active tab + filter values so they survive page refresh
  useEffect(() => {
    saveFilters(filterTab, filters)
  }, [filterTab, filters])


  const handleResetAll = () => {
    const defaultFilters = {
      month: currentMonth(),
      year: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      category: ''
    }
    setFilters(defaultFilters)
    setDateError('')
    setSearch('')
    setAdvanced(DEFAULT_ADVANCED)
    setPageSize(5)
    setPage(1)
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
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
    const result = await removeExpense(expenseToDelete._id)
    setShowDeleteConfirm(false)
    setExpenseToDelete(null)

    if (result.success) {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Expense deleted</span>
            <button
              onClick={async () => {
                toast.dismiss(t.id)
                const restored = await restoreExpense(result.deleted)
                if (restored.success) {
                  toast.success('Expense restored!')
                  fetchExpenses(buildParams())
                } else {
                  toast.error(restored.message || 'Could not restore')
                }
              }}
              className="text-sm font-semibold text-sage hover:text-sage-dark underline"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 3000, icon: '🗑️' }
      )
      fetchExpenses(buildParams())
    } else {
      toast.error(result.message || 'Failed to delete expense')
    }
  }

  const handleFormSubmit = async (payload) => {
    setFormLoading(true)
    const res = editingExpense
      ? await editExpense(editingExpense._id, payload)
      : await addExpense(payload)
    setFormLoading(false)

    if (res?.success) {
      toast.success(editingExpense ? 'Expense updated!' : 'Expense added!')
      setIsFormOpen(false)
      setEditingExpense(null)
      fetchExpenses(buildParams())
    } else if (res && !res.success && !res.exceedsBudget) {
      // Only show toast for non-budget errors; budget warning is handled by ExpenseForm popup
      toast.error(res.message || (editingExpense ? 'Update failed' : 'Failed to add expense'))
    }
    return res
  }

  return (
    <div className="space-y-5">
      <FadeInSection>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-zinc-200">Expenses</h2>
            <p className="text-sm text-ink-400 mt-0.5">Browse and manage all transactions</p>
          </div>
          <HoverButton
            onClick={() => {
              setEditingExpense(null)
              setIsFormOpen(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-lg font-bold">+</span> Add Expense
          </HoverButton>
        </div>
      </FadeInSection>

      <FadeInSection delay={0.05}>
        {/* ── Filter card ── */}
        <div className="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none p-5 space-y-5">

          {/* Section label */}
          <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-zinc-500">
            Filter by period
          </p>

          {/* Tab strip */}
          <div className="bg-gray-100 dark:bg-zinc-700/60 border border-gray-200 dark:border-zinc-600/50 p-1 rounded-2xl flex items-center gap-1 w-full max-w-lg">
            {[
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly',  label: 'Yearly'  },
              { id: 'custom',  label: 'Custom'  },
              { id: 'all',     label: 'All Time' },
            ].map((tab) => {
              const active = filterTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setFilterTab(tab.id); setPage(1) }}
                  className={`py-2 px-4 flex-1 text-center text-sm font-semibold rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-white dark:bg-zinc-600 text-[#1e3825] dark:text-emerald-300 shadow-[0_1px_4px_rgba(0,0,0,0.12)] dark:shadow-none border border-gray-200 dark:border-zinc-500'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 hover:bg-gray-200/60 dark:hover:bg-zinc-600/40'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Period-specific inputs */}
          <div>
            {filterTab === 'monthly' && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 w-14 shrink-0">Month</span>
                <input
                  type="month"
                  value={filters.month}
                  onChange={(e) => { setFilters((p) => ({ ...p, month: e.target.value })); setPage(1) }}
                  className="input-field max-w-[200px] !bg-gray-50 !border-gray-300 dark:!bg-zinc-700/60 dark:!border-zinc-600 focus:!border-sage"
                  max={currentMonth()}
                />
              </div>
            )}

            {filterTab === 'yearly' && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 w-14 shrink-0">Year</span>
                <select
                  value={filters.year}
                  onChange={(e) => { setFilters((p) => ({ ...p, year: e.target.value })); setPage(1) }}
                  className="input-field max-w-[150px] !bg-gray-50 !border-gray-300 dark:!bg-zinc-700/60 dark:!border-zinc-600"
                >
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {filterTab === 'custom' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 w-16 shrink-0">Start</span>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => {
                        setFilters((p) => ({ ...p, startDate: e.target.value }))
                        setPage(1)
                      }}
                      className={`input-field max-w-[170px] !bg-gray-50 dark:!bg-zinc-700/60 dark:!border-zinc-600 ${
                        dateError
                          ? '!border-red-400 focus:!ring-red-300/30'
                          : '!border-gray-300 focus:!border-sage'
                      }`}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 w-16 shrink-0">End</span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => {
                        setFilters((p) => ({ ...p, endDate: e.target.value }))
                        setPage(1)
                      }}
                      className={`input-field max-w-[170px] !bg-gray-50 dark:!bg-zinc-700/60 dark:!border-zinc-600 ${
                        dateError
                          ? '!border-red-400 focus:!ring-red-300/30'
                          : '!border-gray-300 focus:!border-sage'
                      }`}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                {dateError && (
                  <p className="text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {dateError}
                  </p>
                )}
              </div>
            )}

            {filterTab === 'all' && (
              <p className="text-xs text-gray-400 dark:text-zinc-500 italic flex items-center gap-1.5">
                <span>📂</span> Showing all transactions since account creation.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-zinc-700" />

          {/* Category row */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-zinc-500">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => { setFilters((p) => ({ ...p, category: e.target.value })); setPage(1) }}
                className="input-field !bg-gray-50 !border-gray-300 dark:!bg-zinc-700/60 dark:!border-zinc-600 hover:!border-gray-400 transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c || 'All categories'}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleResetAll}
              className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-700/50 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 border border-gray-300 dark:border-zinc-600 transition-all duration-150"
            >
              Reset filters
            </button>
          </div>
        </div>
      </FadeInSection>

      <FadeInSection delay={0.08}>
        <SearchFilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          advanced={advanced}
          onAdvancedChange={(v) => { setAdvanced((p) => ({ ...p, ...v })); setPage(1) }}
          onReset={handleResetAll}
        />
      </FadeInSection>

      {loading ? (
        <ExpenseListSkeleton count={5} />
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-coral text-sm font-medium">{error}</p>
          <HoverButton onClick={() => fetchExpenses(buildParams())} className="btn-ghost mt-3 text-sm">
            Try again
          </HoverButton>
        </div>
      ) : expenses.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-600 font-medium">
            {filterTab === 'custom'
              ? 'No expenses found for the selected date range'
              : 'No expenses found'}
          </p>
          <p className="text-ink-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
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
            onPageChange={setPage}
            onLimitChange={(n) => { setPageSize(n); setPage(1) }}
          />
        </>
      )}

      <ScaleModal
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingExpense(null) }}
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <p className="label mb-3">{editingExpense ? 'Edit expense' : 'Add expense'}</p>
          <ExpenseForm
            onSubmit={handleFormSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingExpense(null) }}
            initialData={editingExpense}
            loading={formLoading}
          />
        </div>
      </ScaleModal>

      <ScaleModal
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setExpenseToDelete(null) }}
        maxWidth="max-w-sm"
      >
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold text-ink-800 dark:text-zinc-200 mb-2">Delete Expense?</h3>
          <p className="text-sm text-ink-400 mb-6">This action cannot be undone.</p>
          <div className="flex flex-col gap-2">
            <HoverButton onClick={confirmDelete} className="w-full py-2.5 rounded-xl bg-coral text-white font-semibold text-sm">
              Delete
            </HoverButton>
            <HoverButton
              onClick={() => { setShowDeleteConfirm(false); setExpenseToDelete(null) }}
              className="w-full py-2.5 rounded-xl bg-ink-50 text-ink-600 font-medium text-sm"
            >
              Cancel
            </HoverButton>
          </div>
        </div>
      </ScaleModal>
    </div>
  )
}

export default ExpensesPage
