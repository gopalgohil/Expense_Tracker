import { useEffect, useRef, useState } from 'react'

/* Animates a number from 0 to target on mount */
const CountUpNumber = ({ value, prefix = '', suffix = '', decimals = 0, duration = 1200 }) => {
  const [display, setDisplay] = useState(0)
  const rafRef  = useRef(null)
  const prevVal = useRef(0)

  useEffect(() => {
    const start     = prevVal.current
    const end       = value
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3)
      const current  = start + (end - start) * eased
      setDisplay(current)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else prevVal.current = end
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  const formatted = decimals > 0
    ? display.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(display).toLocaleString('en-IN')

  return <span>{prefix}{formatted}{suffix}</span>
}

export default CountUpNumber
