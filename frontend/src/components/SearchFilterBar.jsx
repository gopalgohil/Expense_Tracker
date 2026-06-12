import { useEffect, useRef } from 'react'

const SORT_OPTIONS = [
  { value: 'date_desc',   label: '🕐 Newest first'     },
  { value: 'date_asc',    label: '🕐 Oldest first'      },
  { value: 'amount_desc', label: '₹ Highest amount'    },
  { value: 'amount_asc',  label: '₹ Lowest amount'     },
]

const SearchFilterBar = ({ search, onSearchChange, advanced, onAdvancedChange, onReset }) => {
  const debounceRef = useRef(null)

  // Debounced search — 300ms
  const handleSearch = (e) => {
    const val = e.target.value
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearchChange(val), 300)
  }

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  return (
    <div className="card p-4 space-y-3">
      {/* Search bar */}
      <div style={{ position: 'relative' }}>
        <svg
          style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}
          width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          defaultValue={search}
          onChange={handleSearch}
          placeholder="Search by description…"
          className="input-field"
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Advanced filters row */}
      <div className="flex flex-wrap gap-3">
        {/* Min amount */}
        <div className="flex-1 min-w-[110px]">
          <label className="label">Min (₹)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:13 }}>₹</span>
            <input
              type="number" min="0" placeholder="0"
              value={advanced.minAmount}
              onChange={(e) => onAdvancedChange({ minAmount: e.target.value })}
              className="input-field font-mono"
              style={{ paddingLeft: 26 }}
            />
          </div>
        </div>

        {/* Max amount */}
        <div className="flex-1 min-w-[110px]">
          <label className="label">Max (₹)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:13 }}>₹</span>
            <input
              type="number" min="0" placeholder="∞"
              value={advanced.maxAmount}
              onChange={(e) => onAdvancedChange({ maxAmount: e.target.value })}
              className="input-field font-mono"
              style={{ paddingLeft: 26 }}
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex-1 min-w-[160px]">
          <label className="label">Sort by</label>
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

        {/* Reset */}
        <div className="flex items-end">
          <button onClick={onReset} className="btn-ghost text-sm py-3">
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchFilterBar
