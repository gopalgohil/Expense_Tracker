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

  const btnBase = {
    minWidth: 36, height: 36, borderRadius: 10,
    border: '1px solid #e8e6df', background: '#fff',
    cursor: 'pointer', fontSize: 13, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, paddingTop:8 }}>
      {/* Info */}
      <p style={{ fontSize:12, color:'#7a7670' }}>
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> expenses
      </p>

      {/* Controls */}
      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1 }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* First page if not in range */}
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} style={btnBase}>1</button>
            {start > 2 && <span style={{ color:'#9ca3af', padding:'0 4px' }}>…</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              ...btnBase,
              background:   p === page ? '#4a7c59' : '#fff',
              color:        p === page ? '#fff'    : '#0f0e0c',
              borderColor:  p === page ? '#4a7c59' : '#e8e6df',
              fontWeight:   p === page ? 700       : 500,
            }}
          >
            {p}
          </button>
        ))}

        {/* Last page if not in range */}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span style={{ color:'#9ca3af', padding:'0 4px' }}>…</span>}
            <button onClick={() => onPageChange(totalPages)} style={btnBase}>{totalPages}</button>
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={{ ...btnBase, opacity: page === totalPages ? 0.4 : 1 }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Pagination
