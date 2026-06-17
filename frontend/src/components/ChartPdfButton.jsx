import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'

/**
 * Captures the charts grid DOM node and downloads a styled PDF.
 *
 * Props:
 *  chartsRef  — React ref pointing to the wrapper div around all 4 charts
 *  month      — "YYYY-MM" string used for the filename and header
 *  userName   — optional user display name shown in the PDF header
 */
const ChartPdfButton = ({ chartsRef, month, userName }) => {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!chartsRef?.current) {
      toast.error('Charts not ready yet')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Generating PDF…')

    try {
      // ── 1. Capture the charts grid as a canvas ──────────────────────────
      const canvas = await html2canvas(chartsRef.current, {
        scale: 2,           // retina quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData   = canvas.toDataURL('image/png')
      const imgWidth  = canvas.width
      const imgHeight = canvas.height

      // ── 2. Set up PDF (A4 portrait, mm units) ───────────────────────────
      const pdf       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW     = pdf.internal.pageSize.getWidth()   // 210 mm
      const pageH     = pdf.internal.pageSize.getHeight()  // 297 mm
      const margin    = 14  // mm

      // ── 3. Header band ──────────────────────────────────────────────────
      // Background strip
      pdf.setFillColor(74, 124, 89)   // sage green #4a7c59
      pdf.rect(0, 0, pageW, 28, 'F')

      // App name
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.setTextColor(255, 255, 255)
      pdf.text('SpendWise — Reports & Analytics', margin, 12)

      // Sub-line: period + generated info
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.setTextColor(200, 230, 210)

      const periodLabel = month
        ? (() => {
            const [y, m] = month.split('-').map(Number)
            return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
          })()
        : 'All Time'

      const now       = new Date()
      const generated = now.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      }) + '  ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

      const namePart = userName ? `  •  ${userName}` : ''
      pdf.text(`Period: ${periodLabel}${namePart}  •  Generated: ${generated}`, margin, 21)

      // ── 4. Place the chart image below the header ───────────────────────
      const contentTop  = 32   // mm — start below header band
      const maxW        = pageW - margin * 2
      const scale       = maxW / (imgWidth / 3.7795)   // px → mm (96 dpi ≈ 3.7795 px/mm)
      const scaledH     = (imgHeight / 3.7795) * scale
      const availH      = pageH - contentTop - margin

      if (scaledH <= availH) {
        // Fits on one page
        pdf.addImage(imgData, 'PNG', margin, contentTop, maxW, scaledH)
      } else {
        // Tall chart: slice across pages
        const ratio     = imgWidth / imgHeight
        const sliceH_mm = availH
        const sliceH_px = Math.round((sliceH_mm / scale) * (imgWidth / 3.7795) / ratio)

        let yOffset = 0
        let first   = true

        while (yOffset < imgHeight) {
          if (!first) {
            pdf.addPage()
            // Thin header stripe on continuation pages
            pdf.setFillColor(74, 124, 89)
            pdf.rect(0, 0, pageW, 8, 'F')
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(8)
            pdf.setTextColor(255, 255, 255)
            pdf.text('SpendWise — Reports & Analytics (continued)', margin, 5.5)
          }

          const topY    = first ? contentTop : 12
          const avail   = pageH - topY - margin

          // Create a sub-canvas for this slice
          const sliceCanvas = document.createElement('canvas')
          const slicePx     = Math.min(sliceH_px, imgHeight - yOffset)
          sliceCanvas.width  = imgWidth
          sliceCanvas.height = slicePx
          const ctx = sliceCanvas.getContext('2d')
          ctx.drawImage(canvas, 0, yOffset, imgWidth, slicePx, 0, 0, imgWidth, slicePx)

          const sliceImg   = sliceCanvas.toDataURL('image/png')
          const sliceH_mmR = (slicePx / 3.7795) * scale

          pdf.addImage(sliceImg, 'PNG', margin, topY, maxW, Math.min(sliceH_mmR, avail))

          yOffset += slicePx
          first    = false
        }
      }

      // ── 5. Footer with page number ──────────────────────────────────────
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7)
        pdf.setTextColor(160, 160, 160)
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageW / 2,
          pageH - 5,
          { align: 'center' }
        )
      }

      // ── 6. Save ─────────────────────────────────────────────────────────
      const safePeriod = month ? month : 'all-time'
      pdf.save(`spendwise-charts-${safePeriod}.pdf`)
      toast.success('PDF downloaded!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl
        bg-white dark:bg-zinc-800 border border-ink-200 dark:border-zinc-700
        text-ink-600 dark:text-zinc-300 text-sm font-medium
        hover:border-coral dark:hover:border-coral
        hover:text-coral dark:hover:text-coral
        hover:bg-coral-soft dark:hover:bg-coral-soft/10
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 shadow-card hover:shadow-lift"
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin text-coral" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Generating…</span>
        </>
      ) : (
        <>
          {/* PDF icon */}
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5"
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 13h6M9 17h4" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M13 3v4a1 1 0 001 1h4" />
          </svg>
          <span>Download PDF</span>
        </>
      )}
    </button>
  )
}

export default ChartPdfButton
