const COLORS = {
  'Food & Dining': '#d4a017', 'Transport': '#3b82f6', 'Shopping': '#a855f7',
  'Entertainment': '#ec4899', 'Health': '#22c55e',  'Utilities': '#f97316',
  'Housing': '#6366f1', 'Education': '#06b6d4', 'Travel': '#14b8a6', 'Other': '#9ca3af',
}

const StatsBar = ({ expenses }) => {
  if (!expenses.length) return null

  const total    = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {})
  const sorted   = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const top      = sorted[0]

  return (
    <div className="card p-5">
      <div className="flex flex-wrap gap-6 items-start">
        <div>
          <p className="label">Total spent</p>
          <p className="text-2xl font-semibold font-mono text-ink-800">
            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="label">Transactions</p>
          <p className="text-2xl font-semibold text-ink-800">{expenses.length}</p>
        </div>
        {top && (
          <div>
            <p className="label">Top category</p>
            <p className="text-lg font-medium text-ink-800">{top[0]}</p>
            <p className="text-xs text-ink-400 font-mono">
              ₹{top[1].toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({Math.round((top[1] / total) * 100)}%)
            </p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="label mb-2">Breakdown</p>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {sorted.map(([cat, amt]) => (
            <div key={cat}
              style={{ width: `${(amt / total) * 100}%`, backgroundColor: COLORS[cat] || COLORS['Other'] }}
              title={`${cat}: ₹${amt.toFixed(2)}`} className="rounded-sm" />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {sorted.slice(0, 6).map(([cat]) => (
            <span key={cat} className="flex items-center gap-1 text-xs text-ink-500">
              <span className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: COLORS[cat] || COLORS['Other'] }} />
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatsBar
