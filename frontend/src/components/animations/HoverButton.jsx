import { motion } from 'framer-motion'

/* Subtle scale + lift on hover for buttons and icon actions */
export const HoverButton = ({ children, className = '', disabled, ...props }) => (
  <motion.button
    className={className}
    disabled={disabled}
    whileHover={disabled ? undefined : { scale: 1.04 }}
    whileTap={disabled ? undefined : { scale: 0.96 }}
    transition={{ duration: 0.15 }}
    {...props}
  >
    {children}
  </motion.button>
)

export const HoverIcon = ({ children, className = '', ...props }) => (
  <motion.button
    className={className}
    whileHover={{ scale: 1.15 }}
    whileTap={{ scale: 0.9 }}
    transition={{ duration: 0.12 }}
    {...props}
  >
    {children}
  </motion.button>
)
