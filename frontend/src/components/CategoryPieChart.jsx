import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = {
  'Food & Dining': '#d4a017',
  'Transport':     '#3b82f6',
  'Shopping':      '#a855f7',
  'Entertainment': '#ec4899',
  'Health':        '#22c55e',
  'Utilities':     '#f97316',
  'Housing':       '#6366f1',
  'Education':     '#06b6d4',
  'Travel':        '#14b8a6',
  'Other':         '#9ca3af',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white border border-ink-100 rounded-xl shadow-lift px-3 py-2 text-xs">
      <p className="font-medium text-ink-700">{name}</p>
      <p className="text-ink-500 font-mono mt-0.5">
        ₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

const CategoryPieChart = ({ expenses }) => {
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (!data.length) return null

  return (
    <div className="card p-5">
      <p className="label mb-4">Category breakdown</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name] || COLORS['Other']}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-ink-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryPieChart
