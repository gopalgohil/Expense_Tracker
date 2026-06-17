import { motion, AnimatePresence } from 'framer-motion'

/* Reusable modal — backdrop fade + content scale */
const ScaleModal = ({ open, onClose, children, maxWidth = 'max-w-sm', className = '' }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 pointer-events-none">
          <motion.div
            key="modal"
            className={`card w-full ${maxWidth} pointer-events-auto ${className}`}
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
)

export default ScaleModal
