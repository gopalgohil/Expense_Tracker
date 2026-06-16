import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* Stagger container for list rows */
export const ListContainer = ({ children, className = '' }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden:  {},
      visible: { transition: { staggerChildren: 0.06 } },
    }}
  >
    {children}
  </motion.div>
)

/* Each row — slide in, green highlight when new, collapse on delete */
export const ListItem = React.forwardRef(({ children, layout = true, isNew = false, index = 0 }, ref) => (
  <motion.div
    ref={ref}
    layout={layout}
    initial={{ opacity: 0, x: -24 }}
    animate={{ opacity: 1, x: 0, transition: { duration: 0.28, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] } }}
    exit={{
      opacity: 0,
      height: 0,
      marginBottom: 0,
      overflow: 'hidden',
      transition: { duration: 0.25, ease: 'easeIn' },
    }}
    className={isNew ? 'animate-highlight-new rounded-2xl' : ''}
  >
    {children}
  </motion.div>
))

/* Wraps AnimatePresence + stagger for expense lists */
export const AnimatedList = ({ children, className = '' }) => (
  <ListContainer className={className}>
    <AnimatePresence mode="popLayout" initial={false}>
      {children}
    </AnimatePresence>
  </ListContainer>
)
