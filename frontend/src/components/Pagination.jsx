const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, total, limit } = pagination
  if (totalPages <= 1) return null

  const from = (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  // Build page numbers to show (max 5 visible)
  const pages = []
  let start = Math.max(1, page - 2)
  let end   = Math.min(totalPages, page + 2)
  if (end - start < 4) {
    if (start === 1) end   = Math.min(totalPages, start + 4)
    else             start = Math.max(1, end - 4)
  }
  for (let i = start; i <= end; i++) pages.push(i)

  const btnClass = "px-3 py-2 min-w-[36px] h-9 rounded-xl border border-ink-200 dark:border-gray-700 bg-white dark:bg-[#1e2130] text-ink-800 dark:text-gray-300 font-medium text-xs flex items-center justify-center hover:bg-ink-50 dark:hover:bg-gray-800 hover:border-sage transition-all disabled:opacity-40 disabled:cursor-not-allowed"
  const activeBtnClass = "px-3 py-2 min-w-[36px] h-9 rounded-xl bg-sage text-white font-bold text-xs flex items-center justify-center border border-sage"

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-6 border-t border-ink-100 mt-4">
      {/* Info */}
      <p className="text-xs text-ink-500">
        Showing <strong className="text-ink-800 dark:text-gray-300 font-semibold">{from}–{to}</strong> of <strong className="text-ink-800 dark:text-gray-300 font-semibold">{total}</strong> expenses
      </p>

      {/* Controls */}
      <div className="flex gap-1.5 items-center">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={btnClass}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* First page if not in range */}
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className={btnClass}>1</button>
            {start > 2 && <span className="text-ink-400 dark:text-gray-500 px-1">…</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={p === page ? activeBtnClass : btnClass}
          >
            {p}
          </button>
        ))}

        {/* Last page if not in range */}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-ink-400 dark:text-gray-500 px-1">…</span>}
            <button onClick={() => onPageChange(totalPages)} className={btnClass}>{totalPages}</button>
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={btnClass}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Pagination
