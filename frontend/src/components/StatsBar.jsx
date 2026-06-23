import { motion } from 'framer-motion'
import CountUpNumber from './animations/CountUpNumber'

const COLORS = {
  'Food & Dining': '#d4a017', 'Transport': '#3b82f6', 'Shopping': '#a855f7',
  'Entertainment': '#ec4899', 'Health': '#22c55e', 'Utilities': '#f97316',
  'Housing': '#6366f1', 'Education': '#06b6d4', 'Travel': '#14b8a6', 'Other': '#9ca3af',
}

const StatCard = ({ label, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay, ease: 'easeOut' }}
  >
    <p className="label">{label}</p>
    {children}
  </motion.div>
)

const StatsBar = ({ expenses }) => {
  if (!expenses.length) return null

  const total      = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
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
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-6 items-start">

        <StatCard label="Total spent" delay={0}>
          <p className="text-2xl font-semibold font-mono text-ink-800">
            ₹<CountUpNumber value={total} decimals={2} />
          </p>
        </StatCard>

        <StatCard label="Transactions" delay={0.08}>
          <p className="text-2xl font-semibold text-ink-800">
            <CountUpNumber value={expenses.length} />
          </p>
        </StatCard>

        {top && (
          <StatCard label="Top category" delay={0.16}>
            <p className="text-lg font-medium text-ink-800">{top[0]}</p>
            <p className="text-xs text-ink-400 font-mono">
              ₹<CountUpNumber value={top[1]} decimals={2} />
              {' '}({Math.round((top[1] / total) * 100)}%)
            </p>
          </StatCard>
        )}

        <StatCard label="Avg per transaction" delay={0.24}>
          <p className="text-2xl font-semibold font-mono text-ink-800">
            ₹<CountUpNumber value={total / expenses.length} decimals={0} />
          </p>
        </StatCard>
      </div>

      {/* Breakdown bar */}
      <div className="mt-5">
        <p className="label mb-2">Breakdown</p>
        <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
          {sorted.map(([cat, amt], i) => (
            <motion.div
              key={cat}
              style={{ backgroundColor: COLORS[cat] || COLORS['Other'] }}
              title={`${cat}: ₹${amt.toFixed(2)}`}
              className="rounded-sm"
              initial={{ width: 0 }}
              animate={{ width: `${(amt / total) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-2.5">
          {sorted.slice(0, 6).map(([cat]) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-ink-500">
              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: COLORS[cat] || COLORS['Other'] }} />
              {cat}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default StatsBar
