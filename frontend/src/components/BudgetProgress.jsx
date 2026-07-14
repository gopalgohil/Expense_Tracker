import { motion } from 'framer-motion'
import FadeInSection from './animations/FadeInSection'
import { useAuth } from '../context/AuthContext'

const bar = (percent) => {
  if (percent >= 90) return { bg: '#fee2e2', fill: '#ef4444', text: '#b91c1c' }
  if (percent >= 70) return { bg: '#fef9c3', fill: '#eab308', text: '#92400e' }
  return               { bg: '#dcfce7', fill: '#22c55e', text: '#166534' }
}

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
}

const BudgetProgress = ({ status }) => {
  const { user } = useAuth()
  if (!status.length) return null

  const baseCurrency = user?.currency || 'INR'
  const symbol = CURRENCY_SYMBOLS[baseCurrency] || baseCurrency || '₹'
  const locale = baseCurrency === 'INR' ? 'en-IN' : 'en-US'

  return (
    <FadeInSection>
      <div className="card p-5 space-y-4">
        <p className="label">Budget status</p>
        {status.map((item, i) => {
          const pct    = Math.min(item.percent, 100)
          const over   = item.percent > 100
          const colors = bar(item.percent)

          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-ink-700">{item.category}</span>
                <span className="text-xs font-mono" style={{ color: colors.text }}>
                  {symbol}{item.spent.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / {symbol}{item.limit.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  {over && <span className="ml-1 font-semibold">(over budget!)</span>}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.bg }}>
                <motion.div
                  className="h-2 rounded-full"
                  style={{ background: colors.fill }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08 + 0.15, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs mt-0.5" style={{ color: colors.text }}>
                {item.percent}% used
              </p>
            </motion.div>
          )
        })}
      </div>
    </FadeInSection>
  )
}

export default BudgetProgress
