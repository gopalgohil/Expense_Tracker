import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HoverButton } from './animations/HoverButton'
import DateRangeSelector from './DateRangeSelector'
import { useCurrency } from '../hooks/useCurrency'

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Highest amount' },
  { value: 'amount_asc', label: 'Lowest amount' },
]

const CATEGORIES = [
  '', 'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Utilities', 'Housing', 'Education', 'Travel', 'Other',
]

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const SearchFilterBar = ({
  search,
  onSearchChange,
  month,
  onMonthChange,
  dateRangeType,
  onDateRangeTypeChange,
  year,
  onYearChange,
  customRange,
  onCustomRangeChange,
  category,
  onCategoryChange,
  advanced,
  onAdvancedChange,
  onReset,
}) => {
  const { currencySymbol } = useCurrency()
  const debounceRef = useRef(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Debounced search — 300ms
  const handleSearch = (e) => {
    const val = e.target.value
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearchChange(val), 300)
  }

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  return (
    <div className="card p-6 space-y-6">
      {/* Row 1: Search Description and Category Select */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Description */}
        <div className="md:col-span-8 space-y-1.5">
          <label className="label text-xs font-semibold text-ink-500 uppercase tracking-wider">Search Description</label>
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-400 w-4 h-4"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              defaultValue={search}
              onChange={handleSearch}
              placeholder="Search expenses by description..."
              className="input-field pl-11 h-11 bg-ink-50/50 focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="label text-xs font-semibold text-ink-500 uppercase tracking-wider">Category</label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="input-field bg-white h-11"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c || 'All categories'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Flat Date Range Selector & Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-5 border-t border-ink-100/60">
        {/* Date Range Selector */}
        <div className="md:col-span-8 space-y-1.5">
          <label className="label text-xs font-semibold text-ink-500 uppercase tracking-wider">Date Filter</label>
          <DateRangeSelector
            dateRangeType={dateRangeType}
            onDateRangeTypeChange={onDateRangeTypeChange}
            month={month}
            onMonthChange={onMonthChange}
            year={year}
            onYearChange={onYearChange}
            customRange={customRange}
            onCustomRangeChange={onCustomRangeChange}
          />
        </div>

        {/* Actions Button Panel */}
        <div className="md:col-span-4 flex gap-3">
          <HoverButton
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`btn-ghost flex-1 flex items-center justify-center gap-1.5 h-11 text-xs font-semibold transition-all border rounded-xl ${
              showAdvanced ? 'bg-sage-light text-sage border-sage/20 shadow-sm' : 'border-ink-200 text-ink-600'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Advanced Filters
          </HoverButton>
          <HoverButton
            type="button"
            onClick={onReset}
            className="btn-ghost flex-1 h-11 text-xs font-semibold text-ink-500 hover:text-ink-800 border border-ink-150 hover:bg-ink-50 rounded-xl"
          >
            Reset
          </HoverButton>
        </div>
      </div>

      {/* Advanced filters collapsible drawer */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-ink-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Min amount */}
              <div className="space-y-1">
                <label className="label">Min price</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 font-medium text-xs">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={advanced.minAmount}
                    onChange={(e) => onAdvancedChange({ minAmount: e.target.value })}
                    className="input-field pl-7 font-mono"
                  />
                </div>
              </div>

              {/* Max amount */}
              <div className="space-y-1">
                <label className="label">Max price</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 font-medium text-xs">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={advanced.maxAmount}
                    onChange={(e) => onAdvancedChange({ maxAmount: e.target.value })}
                    className="input-field pl-7 font-mono"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="label">Sort By</label>
                <select
                  value={advanced.sortBy}
                  onChange={(e) => onAdvancedChange({ sortBy: e.target.value })}
                  className="input-field bg-white"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchFilterBar
