import { motion } from 'framer-motion'
import CountUpNumber from './animations/CountUpNumber'
import { useAuth } from '../context/AuthContext'

const COLORS = {
  'Food & Dining': '#eab308', 'Transport': '#3b82f6', 'Shopping': '#a855f7',
  'Entertainment': '#ec4899', 'Health': '#22c55e', 'Utilities': '#f97316',
  'Housing': '#6366f1', 'Education': '#06b6d4', 'Travel': '#14b8a6', 'Other': '#9ca3af',
}

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
}

const StatCard = ({ label, icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    className="bg-zinc-50/50 dark:bg-zinc-900/40 border border-ink-100/50 dark:border-zinc-800/40 rounded-2xl p-4 flex items-center gap-4 flex-1 min-w-[200px] hover:border-sage/40 dark:hover:border-emerald-500/35 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-default"
  >
    <div className="w-10 h-10 rounded-xl bg-sage-light dark:bg-emerald-950/30 text-sage dark:text-emerald-450 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-ink-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  </motion.div>
)

const StatsBar = ({ expenses }) => {
  const { user } = useAuth()
  if (!expenses.length) return null

  const baseCurrency = user?.currency || 'INR'
  const symbol = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency || '₹'

  const total      = expenses.reduce((s, e) => s + (e.amountInBaseCurrency ?? e.amount), 0)
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amountInBaseCurrency ?? e.amount)
    return acc
  }, {})
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const top    = sorted[0]

  return (
    <motion.div
      className="card p-5"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Spent Stat Card */}
        <StatCard 
          label="Total spent" 
          delay={0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <p className="text-xl font-bold font-mono text-ink-800 dark:text-zinc-150">
            {symbol}<CountUpNumber value={total} decimals={2} />
          </p>
        </StatCard>

        {/* Transactions Stat Card */}
        <StatCard 
          label="Transactions" 
          delay={0.08}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        >
          <p className="text-xl font-bold text-ink-800 dark:text-zinc-150">
            <CountUpNumber value={expenses.length} />
          </p>
        </StatCard>

        {/* Top Category Stat Card */}
        <StatCard 
          label="Top category" 
          delay={0.16}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
            </svg>
          }
        >
          {top ? (
            <div>
              <p className="text-sm font-bold text-ink-800 dark:text-zinc-150 truncate max-w-[150px]">{top[0]}</p>
              <p className="text-[10px] text-ink-400 dark:text-zinc-500 font-mono mt-0.5">
                {symbol}<CountUpNumber value={top[1]} decimals={0} />
                {' '}({Math.round((top[1] / total) * 100)}%)
              </p>
            </div>
          ) : (
            <p className="text-sm font-bold text-ink-400">—</p>
          )}
        </StatCard>

        {/* Avg per Transaction Stat Card */}
        <StatCard 
          label="Avg per transaction" 
          delay={0.24}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        >
          <p className="text-xl font-bold font-mono text-ink-800 dark:text-zinc-150">
            {symbol}<CountUpNumber value={total / expenses.length} decimals={0} />
          </p>
        </StatCard>
      </div>

      {/* Breakdown bar */}
      <div className="mt-6 pt-5 border-t border-ink-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[10px] font-bold text-ink-400 dark:text-zinc-500 uppercase tracking-wider">Expense Breakdown</p>
          <span className="text-[10px] bg-sage-light dark:bg-emerald-950/40 text-sage dark:text-emerald-450 px-2 py-0.5 rounded-full font-bold">
            {sorted.length} Categories
          </span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="flex h-3 rounded-full overflow-hidden bg-ink-50 dark:bg-zinc-900/60 p-0.5 border border-ink-100/50 dark:border-zinc-800/30 gap-0.5">
            {sorted.map(([cat, amt], i) => (
              <motion.div
                key={cat}
                style={{ backgroundColor: COLORS[cat] || COLORS['Other'] }}
                title={`${cat}: ${symbol}${amt.toFixed(2)}`}
                className="h-full rounded-sm transition-all duration-300"
                initial={{ width: 0 }}
                animate={{ width: `${(amt / total) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
              />
            ))}
        </div>

        {/* Legend badges with percentage */}
        <div className="flex flex-wrap gap-2 mt-4">
          {sorted.map(([cat, amt]) => {
            const percentage = Math.round((amt / total) * 100)
            return (
              <span 
                key={cat} 
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-50/70 dark:bg-zinc-900/30 border border-ink-100/50 dark:border-zinc-800/40 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/80 hover:scale-[1.03] hover:border-sage/35 dark:hover:border-emerald-500/25 transition-all duration-200 cursor-default active:scale-[0.98] select-none"
              >
                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: COLORS[cat] || COLORS['Other'] }} />
                <span className="text-ink-700 dark:text-zinc-300 font-medium">{cat}</span>
                <span className="text-ink-400 dark:text-zinc-500 font-mono ml-0.5">{percentage}%</span>
              </span>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default StatsBar
