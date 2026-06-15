import { motion } from 'framer-motion'

/* Re-mounts chart content when chartKey changes — triggers fade + slide */
const AnimatedChart = ({ children, chartKey, className = '' }) => (
  <motion.div
    key={chartKey}
    className={className}
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
)

export default AnimatedChart
