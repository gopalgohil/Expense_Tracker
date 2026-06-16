import { ScaleModal, HoverButton } from './animations'

const SignOutModal = ({ open, onClose, onConfirm }) => {
  return (
    <ScaleModal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-coral-soft dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-ink-800 mb-2">Sign out?</h3>
        <p className="text-sm text-ink-400 mb-6 leading-relaxed">
          Are you sure you want to sign out? You will need to log back in to access your expenses and budgets.
        </p>
        <div className="flex flex-col gap-2">
          <HoverButton
            onClick={onConfirm}
            className="w-full py-2.5 rounded-xl bg-coral text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Sign out
          </HoverButton>
          <HoverButton
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-ink-50 text-ink-600 dark:bg-ink-100/10 dark:text-ink-400 font-medium text-sm hover:bg-ink-100 dark:hover:bg-ink-100/20 transition-colors"
          >
            Cancel
          </HoverButton>
        </div>
      </div>
    </ScaleModal>
  )
}

export default SignOutModal
