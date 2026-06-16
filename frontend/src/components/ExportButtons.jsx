import { useState } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || ''

const ExportButtons = ({ filters }) => {
  const [csvLoading, setCsvLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const buildParams = () => {
    const p = new URLSearchParams()
    if (filters.category) p.append('category', filters.category)

    if (filters.dateRangeType === 'monthly') {
      if (filters.month) p.append('month', filters.month)
    } else if (filters.dateRangeType === 'yearly') {
      if (filters.year) p.append('year', filters.year)
    } else if (filters.dateRangeType === 'custom') {
      if (filters.startDate) p.append('startDate', filters.startDate)
      if (filters.endDate) p.append('endDate', filters.endDate)
    } else if (filters.dateRangeType === 'all') {
      p.append('allTime', 'true')
    }
    return p.toString() ? `?${p.toString()}` : ''
  }

  const getExportLabel = () => {
    if (filters.dateRangeType === 'monthly') return filters.month || 'monthly'
    if (filters.dateRangeType === 'yearly') return filters.year || 'yearly'
    if (filters.dateRangeType === 'custom') return `${filters.startDate || ''}-to-${filters.endDate || ''}`
    return 'all-time'
  }

  const download = async (type) => {
    const isCsv  = type === 'csv'
    const setLoading = isCsv ? setCsvLoading : setPdfLoading
    setLoading(true)

    try {
      const url = `${BASE}/api/expenses/export/${type}${buildParams()}`

      const res = await fetch(url, {
        credentials: 'include',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to export ${type.toUpperCase()}`)
      }

      const blob     = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = objectUrl
      a.download     = `spendwise-expenses-${getExportLabel()}.${type}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)

      toast.success(`${type.toUpperCase()} downloaded!`)
    } catch (err) {
      toast.error(err.message || `Export failed`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* CSV Button */}
      <button
        onClick={() => download('csv')}
        disabled={csvLoading || pdfLoading}
        className="export-btn group flex items-center gap-2 px-4 py-2 rounded-xl
          bg-white border border-ink-200 text-ink-600 text-sm font-medium
          hover:border-sage hover:text-sage hover:bg-sage-light
          active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 shadow-card hover:shadow-lift"
        style={{ animation: csvLoading ? 'none' : undefined }}
      >
        {csvLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin text-sage" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span>Generating…</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
            </svg>
            <span>CSV</span>
          </>
        )}
      </button>

      {/* PDF Button */}
      <button
        onClick={() => download('pdf')}
        disabled={csvLoading || pdfLoading}
        className="export-btn group flex items-center gap-2 px-4 py-2 rounded-xl
          bg-white border border-ink-200 text-ink-600 text-sm font-medium
          hover:border-coral hover:text-coral hover:bg-coral-soft
          active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 shadow-card hover:shadow-lift"
      >
        {pdfLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin text-coral" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span>Generating…</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3" />
            </svg>
            <span>PDF</span>
          </>
        )}
      </button>

      {/* Slide animation keyframes */}
      <style>{`
        .export-btn:not(:disabled):hover svg:first-child {
          animation: slideDown 0.4s ease infinite alternate;
        }
        @keyframes slideDown {
          0%   { transform: translateY(0);    }
          100% { transform: translateY(3px);  }
        }
      `}</style>
    </div>
  )
}

export default ExportButtons
