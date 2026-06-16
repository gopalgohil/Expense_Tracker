import React from 'react'
import { motion } from 'framer-motion'

/* Wraps a page with fade + slide animation between routes */
const PageTransition = React.forwardRef(({ children }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20, x: 8 }}
    animate={{ opacity: 1, y: 0, x: 0 }}
    exit={{ opacity: 0, y: -12, x: -8 }}
    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
))

export default PageTransition
