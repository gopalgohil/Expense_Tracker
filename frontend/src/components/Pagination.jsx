import React, { useState, useEffect } from 'react'

const Pagination = ({
  pagination,
  onPageChange,
  onLimitChange,
  itemLabel = 'expenses',
}) => {
  const { page, totalPages, total, limit } = pagination

  // Local draft so the user can type freely without triggering a fetch on every keystroke
  const [draft, setDraft] = useState(String(limit))
  const [invalid, setInvalid] = useState(false)

  // Keep draft in sync when limit changes externally (e.g. reset)
  useEffect(() => {
    setDraft(String(limit))
    setInvalid(false)
  }, [limit])

  const commit = (raw) => {
    const n = parseInt(raw, 10)
    if (!raw || isNaN(n) || n < 1) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    if (n !== limit) onLimitChange(n)
  }

  if (!total || total === 0) return null

  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  // Build page numbers to show (max 3 visible)
  const pages = []
  let start = Math.max(1, page - 1)
  let end   = Math.min(totalPages, page + 1)
  if (end - start < 2) {
    if (start === 1) end   = Math.min(totalPages, start + 2)
    else             start = Math.max(1, end - 2)
  }
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-ink-100 dark:border-zinc-800/80">

      {/* Left — rows per page input + range info */}
      <div className="flex items-center gap-3 flex-wrap">
        {onLimitChange && (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <label
                htmlFor="rows-per-page"
                className="text-sm text-ink-500 dark:text-zinc-400 whitespace-nowrap"
              >
                Rows per page:
              </label>
              <input
                id="rows-per-page"
                type="number"
                min="1"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  // Clear invalid state while user is still typing
                  if (invalid) setInvalid(false)
                }}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commit(draft)
                  }
                  // Block minus, plus, e, E, dot
                  if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault()
                }}
                className={`w-16 h-9 rounded-xl border text-sm font-semibold text-center px-2
                  bg-white dark:bg-zinc-800 text-ink-700 dark:text-zinc-300
                  focus:outline-none focus:ring-2 transition-colors
                  [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
                  ${invalid
                    ? 'border-red-400 dark:border-red-500 focus:ring-red-300/40'
                    : 'border-ink-200 dark:border-zinc-700 focus:ring-sage/40'
                  }`}
                aria-label="Rows per page"
                aria-invalid={invalid}
              />
            </div>
            {invalid && (
              <p className="text-xs text-red-500 dark:text-red-400 ml-[104px]">
                Enter a positive number
              </p>
            )}
          </div>
        )}

        <p className="text-sm text-ink-500 dark:text-zinc-400">
          <span className="font-semibold text-ink-800 dark:text-zinc-200">{from}–{to}</span>
          {' '}of{' '}
          <span className="font-semibold text-ink-800 dark:text-zinc-200">{total}</span>
          {' '}{itemLabel}
        </p>
      </div>

      {/* Right — prev / page numbers / next */}
      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-ink-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-ink-700 dark:text-zinc-300 hover:bg-ink-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Page numbers */}
        {pages.map((p) => {
          const active = p === page
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`flex items-center justify-center w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-150 ${
                active
                  ? 'bg-sage dark:bg-emerald-600 text-white shadow-sm'
                  : 'border border-ink-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-ink-700 dark:text-zinc-300 hover:bg-ink-50 dark:hover:bg-zinc-700'
              }`}
            >
              {p}
            </button>
          )
        })}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-ink-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-ink-700 dark:text-zinc-300 hover:bg-ink-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

    </div>
  )
}

export default Pagination
