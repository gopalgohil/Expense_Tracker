// Shows spent-vs-limit progress bars for all budgeted categories

const bar = (percent) => {
  if (percent >= 90) return { bg: '#fee2e2', fill: '#ef4444', text: '#b91c1c' }
  if (percent >= 70) return { bg: '#fef9c3', fill: '#eab308', text: '#92400e' }
  return               { bg: '#dcfce7', fill: '#22c55e', text: '#166534' }
}

const BudgetProgress = ({ status }) => {
  if (!status.length) return null

  return (
    <div className="card p-5 space-y-4">
      <p className="label">Budget status</p>
      {status.map((item) => {
        const pct    = Math.min(item.percent, 100)
        const over   = item.percent > 100
        const colors = bar(item.percent)

        return (
          <div key={item._id}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-ink-700">{item.category}</span>
              <span className="text-xs font-mono" style={{ color: colors.text }}>
                ₹{item.spent.toLocaleString('en-IN')} / ₹{item.limit.toLocaleString('en-IN')}
                {over && <span className="ml-1 font-semibold">(over budget!)</span>}
              </span>
            </div>
            {/* Track */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.bg }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: colors.fill }}
              />
            </div>
            <p className="text-xs mt-0.5" style={{ color: colors.text }}>
              {item.percent}% used
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default BudgetProgress
