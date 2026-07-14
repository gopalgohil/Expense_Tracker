import { useAuth } from '../context/AuthContext'

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
}

const SearchFilterBar = ({ search, onSearchChange, advanced, onAdvancedChange, onReset }) => {
  const { user } = useAuth()
  const baseCurrency = user?.currency || 'INR'
  const symbol = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency || '₹'

  const sortOptions = [
    { value: 'date_desc',   label: '🕐 Newest first'   },
    { value: 'date_asc',    label: '🕐 Oldest first'    },
    { value: 'amount_desc', label: `${symbol} Highest amount`  },
    { value: 'amount_asc',  label: `${symbol} Lowest amount`   },
  ]

  return (
    <div className="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-none p-4 space-y-4">

      {/* Section label */}
      <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-zinc-500">
        Search & sort
      </p>

      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-zinc-500"
          width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by category or description…"
          className="input-field pl-10 !bg-gray-50 !border-gray-300 dark:!bg-zinc-700/60 dark:!border-zinc-600 hover:!border-gray-400 focus:!border-sage focus:!ring-2 focus:!ring-sage/20 transition-colors"
        />
      </div>

      {/* Advanced filters row */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3">

        {/* Min amount */}
        <div className="space-y-1.5 col-span-1 md:flex-1 md:min-w-[110px]">
          <label className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-zinc-500 block">
            Min ({symbol})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm pointer-events-none">{symbol}</span>
            <input
              type="number" min="0" placeholder="0"
              value={advanced.minAmount}
              onChange={(e) => onAdvancedChange({ minAmount: e.target.value })}
              className="input-field pl-7 font-mono !bg-gray-50 !border-gray-300 dark:!bg-zinc-700/60 dark:!border-zinc-600 hover:!border-gray-400 focus:!border-sage focus:!ring-2 focus:!ring-sage/20 transition-colors w-full"
            />
          </div>
        </div>

        {/* Max amount */}
        <div className="space-y-1.5 col-span-1 md:flex-1 md:min-w-[110px]">
          <label className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-zinc-500 block">
            Max ({symbol})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm pointer-events-none">{symbol}</span>
            <input
              type="number" min="0" placeholder="∞"
              value={advanced.maxAmount}
              onChange={(e) => onAdvancedChange({ maxAmount: e.target.value })}
              className="input-field pl-7 font-mono !bg-gray-50 !border-gray-300 dark:!bg-zinc-700/60 dark:!border-zinc-600 hover:!border-gray-400 focus:!border-sage focus:!ring-2 focus:!ring-sage/20 transition-colors w-full"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-1.5 col-span-2 md:flex-1 md:min-w-[160px]">
          <label className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-zinc-500 block">
            Sort by
          </label>
          <select
            value={advanced.sortBy}
            onChange={(e) => onAdvancedChange({ sortBy: e.target.value })}
            className="input-field !bg-gray-50 !border-gray-300 dark:!bg-zinc-700/60 dark:!border-zinc-600 hover:!border-gray-400 focus:!border-sage focus:!ring-2 focus:!ring-sage/20 transition-colors w-full"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <div className="col-span-2 md:flex md:items-end md:shrink-0">
          <button
            onClick={onReset}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-700/50 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 border border-gray-300 dark:border-zinc-600 transition-all duration-150"
          >
            Reset
          </button>
        </div>
      </div>

    </div>
  )
}

export default SearchFilterBar
