import { motion } from 'framer-motion'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const YEARS = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i))

const DateRangeSelector = ({
  dateRangeType,
  onDateRangeTypeChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  customRange,
  onCustomRangeChange,
}) => {
  const rangeTypes = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'custom', label: 'Custom' },
    { id: 'all', label: 'All Time' },
  ]

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Tab Pills */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-ink-50 rounded-xl">
        {rangeTypes.map((type) => {
          const isActive = dateRangeType === type.id
          return (
            <button
              key={type.id}
              onClick={() => onDateRangeTypeChange(type.id)}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex-1 min-w-[70px] ${
                isActive ? 'text-sage shadow-sm' : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeRangeTab"
                  className="absolute inset-0 bg-white rounded-lg z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{type.label}</span>
            </button>
          )
        })}
      </div>

      {/* Dynamic Input Picker */}
      <div className="flex items-center gap-2 mt-1">
        {dateRangeType === 'monthly' && (
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs font-medium text-ink-500">Month:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className="input-field py-1.5 px-3 text-xs w-full max-w-[200px]"
              max={currentMonth()}
            />
          </div>
        )}

        {dateRangeType === 'yearly' && (
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs font-medium text-ink-500">Year:</span>
            <select
              value={year}
              onChange={(e) => onYearChange(e.target.value)}
              className="input-field py-1.5 px-3 text-xs bg-white max-w-[120px]"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {dateRangeType === 'custom' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-ink-500 whitespace-nowrap">From:</span>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) => onCustomRangeChange({ ...customRange, startDate: e.target.value })}
                className="input-field py-1.5 px-3 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-ink-500 whitespace-nowrap">To:</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) => onCustomRangeChange({ ...customRange, endDate: e.target.value })}
                className="input-field py-1.5 px-3 text-xs"
              />
            </div>
          </div>
        )}

        {dateRangeType === 'all' && (
          <div className="text-xs text-ink-400 py-1.5 font-medium">
            📂 Showing complete transaction history
          </div>
        )}
      </div>
    </div>
  )
}

export default DateRangeSelector
