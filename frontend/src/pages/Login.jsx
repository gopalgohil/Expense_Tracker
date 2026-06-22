import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { forgotPassword, verifyOTP, resetPassword } from '../api/client'
import hashPassword from '../utils/hashPassword'

const Login = () => {
  const { login, user, initializing } = useAuth()
  const navigate = useNavigate()

  // Mode: 'login' | 'forgot'
  const [mode, setMode] = useState('login')
  
  // Step: 1 (Request OTP) | 2 (Verify OTP) | 3 (New Password Reset)
  const [forgotStep, setForgotStep] = useState(1)

  // Login states
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOTP, setForgotOTP] = useState('')
  const [forgotNewPass, setForgotNewPass] = useState('')
  const [forgotConfirmPass, setForgotConfirmPass] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [forgotErrors, setForgotErrors] = useState({})
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  if (initializing) return null

  // Already logged in → go to dashboard
  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setErrors((p) => ({ ...p, [e.target.name]: '' }))
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = 'Email is required.'
    if (!form.password.trim()) newErrors.password = 'Password is required.'
    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    const result = await login(form.email.trim(), form.password)
    setSubmitting(false)

    if (result.success) {
      navigate('/dashboard')
      return
    }

    const msg = result.message || ''
    if (
      msg.toLowerCase().includes('no account') ||
      msg.toLowerCase().includes('register') ||
      msg.toLowerCase().includes('not found')
    ) {
      toast.error('🚫 No account found! Please register first.', {
        duration: 6000,
        style: {
          background: '#fff1f0',
          color: '#991b1b',
          border: '1px solid #fca5a5',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          padding: '14px 18px',
        },
      })
    } else {
      setErrors({ password: '❌ ' + (msg || 'Incorrect password. Please try again.') })
    }
  }

  // Request OTP (Forgot Step 1)
  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setForgotErrors({})
    
    if (!forgotEmail.trim()) {
      setForgotErrors({ email: 'Email address is required.' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotErrors({ email: 'Please enter a valid email address.' })
      return
    }

    setForgotSubmitting(true)
    try {
      const response = await forgotPassword({ email: forgotEmail.trim() })
      toast.success('OTP sent! Check your inbox or Spam/Junk folder.', { duration: 6000 })
      setForgotStep(2)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP.'
      setForgotErrors({ email: msg })
      toast.error(msg)
    } finally {
      setForgotSubmitting(false)
    }
  }

  // Verify OTP (Forgot Step 2)
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setForgotErrors({})

    if (!forgotOTP.trim()) {
      setForgotErrors({ otp: 'OTP code is required.' })
      return
    }
    if (forgotOTP.trim().length !== 6) {
      setForgotErrors({ otp: 'OTP must be exactly 6 digits.' })
      return
    }

    setForgotSubmitting(true)
    try {
      const response = await verifyOTP({
        email: forgotEmail.trim(),
        otp: forgotOTP.trim()
      })
      toast.success(response.data?.message || 'OTP verified successfully!')
      setForgotStep(3)
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect OTP code.'
      setForgotErrors({ otp: msg })
      toast.error(msg)
    } finally {
      setForgotSubmitting(false)
    }
  }

  // Reset Password (Forgot Step 3)
  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setForgotErrors({})

    const errs = {}
    if (!forgotNewPass) errs.newPass = 'New password is required.'
    else if (forgotNewPass.length < 6) errs.newPass = 'Password must be at least 6 characters.'
    
    if (!forgotConfirmPass) errs.confirm = 'Please confirm your new password.'
    else if (forgotConfirmPass !== forgotNewPass) errs.confirm = 'Passwords do not match.'

    if (Object.keys(errs).length) {
      setForgotErrors(errs)
      return
    }

    setForgotSubmitting(true)
    try {
      const hashedNew = await hashPassword(forgotNewPass)
      const response = await resetPassword({
        email: forgotEmail.trim(),
        otp: forgotOTP.trim(),
        newPassword: hashedNew
      })
      toast.success(response.data?.message || 'Password reset successfully!')
      // Reset state and go back to login
      setMode('login')
      setForgotStep(1)
      setForm((p) => ({ ...p, email: forgotEmail })) // pre-fill email
      setForgotEmail('')
      setForgotOTP('')
      setForgotNewPass('')
      setForgotConfirmPass('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.'
      setForgotErrors({ general: msg })
      toast.error(msg)
    } finally {
      setForgotSubmitting(false)
    }
  }

  const handleBackToLogin = () => {
    setMode('login')
    setForgotStep(1)
    setForgotErrors({})
  }

  const busy = submitting
  const isForgotBusy = forgotSubmitting

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-zinc-950 flex flex-row">
      {/* Left panel */}
      <div className="flex w-1/2 flex-col justify-between bg-[#1e3825] p-12 text-white relative overflow-hidden">
        {/* Subtle background blurs */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

        {/* Brand logo/text */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-emerald-800/40 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Spendwise</span>
        </div>

        {/* Centered Main Heading */}
        <div className="my-auto max-w-lg space-y-4 relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            A smarter way to track <span className="text-emerald-400">expenses</span> and build better <span className="text-emerald-350 font-medium">financial habits</span>.
          </h2>
          <p className="text-emerald-200/80 text-lg">
            Start tracking with clarity and ease.
          </p>
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* Smart Analytics */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-white tracking-wider uppercase mb-1">Smart Analytics</p>
            <p className="text-xs text-emerald-200/70 leading-relaxed">Deep insights on your monthly spending habits.</p>
          </div>

          {/* PDF/CSV Export */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-white tracking-wider uppercase mb-1">PDF / CSV Export</p>
            <p className="text-xs text-emerald-200/70 leading-relaxed">Generate elegant financial reports instantly.</p>
          </div>
        </div>
      </div>

      {/* Right panel (Form) */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-8 bg-zinc-50 dark:bg-zinc-950">
        

        <div className="card p-8 w-full max-w-[440px] shadow-lift border border-sage/20 dark:border-zinc-800">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink-800 dark:text-zinc-150">
              {mode === 'login' ? 'Sign In' : 'Reset Password'}
            </h1>
            <p className="text-sm text-ink-405 dark:text-zinc-400 mt-1 leading-relaxed">
              {mode === 'login' 
                ? 'Welcome back! Enter your details to access your account' 
                : 'Recover your account access'}
            </p>
          </div>

          {mode === 'login' ? (
            /* Login Mode */
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit(e)}
                  autoComplete="email"
                  style={{
                    border: errors.email ? '1.5px solid #ef4444' : undefined,
                  }}
                  className="input-field"
                />
                {errors.email && (
                  <p style={{ color: '#dc2626', fontSize: 12, marginTop: 5, fontWeight: 500 }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase block mb-0">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-sage hover:text-sage-dark font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit(e)}
                    autoComplete="current-password"
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    style={{
                      paddingRight: 44,
                      border: errors.password ? '1.5px solid #ef4444' : undefined,
                    }}
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500 hover:text-ink-600 focus:outline-none"
                  >
                    {showPass ? (
                      <svg width="20" height="20" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p style={{
                    color: '#dc2626', fontSize: 13, marginTop: 6,
                    fontWeight: 500, padding: '6px 10px',
                    background: '#fff1f0', borderRadius: 8,
                    border: '1px solid #fca5a5',
                  }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Sign in button */}
              <button
                type="button"
                onClick={handleLoginSubmit}
                disabled={busy}
                className="btn-primary w-full mt-2"
              >
                {busy ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          ) : (
            /* Forgot Password Mode */
            <div className="space-y-4">
              {forgotStep === 1 && (
                /* Step 1: Request OTP */
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <p className="text-xs text-ink-500 dark:text-zinc-400 leading-relaxed">
                    Enter your registered Gmail address below. We will email you a 6-digit verification code to reset your password.
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                      Gmail Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value)
                        setForgotErrors({})
                      }}
                      className="input-field"
                      style={{
                        border: forgotErrors.email ? '1.5px solid #ef4444' : undefined,
                      }}
                      required
                    />
                    {forgotErrors.email && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        ⚠ {forgotErrors.email}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isForgotBusy}
                    className="btn-primary w-full"
                  >
                    {isForgotBusy ? 'Sending OTP…' : 'Send OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="btn-ghost text-xs w-full py-1 text-center font-medium text-ink-500 dark:text-zinc-400"
                  >
                    Back to Login
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                /* Step 2: Verify OTP */
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <p className="text-xs text-ink-500 dark:text-zinc-400 leading-relaxed">
                    Enter the 6-digit code sent to <strong className="text-ink-700 dark:text-zinc-350">{forgotEmail}</strong>.
                    {' '}<span className="text-amber-500 font-medium">If you don't see it, check your Spam or Junk folder.</span>
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                      One-Time Password (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      value={forgotOTP}
                      onChange={(e) => {
                        setForgotOTP(e.target.value.replace(/\D/g, ''))
                        setForgotErrors({})
                      }}
                      className="input-field font-mono text-center tracking-[8px] text-lg font-bold"
                      style={{
                        border: forgotErrors.otp ? '1.5px solid #ef4444' : undefined,
                      }}
                      required
                    />
                    {forgotErrors.otp && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        ⚠ {forgotErrors.otp}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isForgotBusy}
                    className="btn-primary w-full"
                  >
                    {isForgotBusy ? 'Verifying OTP…' : 'Verify OTP'}
                  </button>
                  <div className="flex justify-between items-center text-xs mt-2">
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={isForgotBusy}
                      className="text-sage font-medium hover:underline"
                    >
                      Resend OTP Code
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-ink-500 dark:text-zinc-400 font-medium hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                /* Step 3: Enter New Password */
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <p className="text-xs text-ink-500 dark:text-zinc-400 leading-relaxed">
                    OTP verified successfully! Please enter your new password to complete the reset.
                  </p>

                  {forgotErrors.general && (
                    <div className="bg-coral-soft text-coral text-xs px-3 py-2 rounded-xl border border-coral-light">
                      ⚠ {forgotErrors.general}
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={forgotNewPass}
                        onChange={(e) => {
                          setForgotNewPass(e.target.value)
                          setForgotErrors({})
                        }}
                        onCopy={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        onDrop={(e) => e.preventDefault()}
                        className="input-field"
                        style={{
                          paddingRight: 44,
                          border: forgotErrors.newPass ? '1.5px solid #ef4444' : undefined,
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500 hover:text-ink-600 focus:outline-none"
                      >
                        {showNewPass ? (
                          <svg width="20" height="20" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {forgotErrors.newPass && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        ⚠ {forgotErrors.newPass}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-500 dark:text-zinc-400 tracking-wider uppercase mb-1.5 block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={forgotConfirmPass}
                        onChange={(e) => {
                          setForgotConfirmPass(e.target.value)
                          setForgotErrors({})
                        }}
                        onCopy={(e) => e.preventDefault()}
                        onPaste={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        onDrop={(e) => e.preventDefault()}
                        className="input-field"
                        style={{
                          paddingRight: 44,
                          border: forgotErrors.confirm ? '1.5px solid #ef4444' : undefined,
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-zinc-500 hover:text-ink-600 focus:outline-none"
                      >
                        {showConfirmPass ? (
                          <svg width="20" height="20" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {forgotErrors.confirm && (
                      <p className="text-red-500 text-xs mt-1 font-medium">
                        ⚠ {forgotErrors.confirm}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotBusy}
                    className="btn-primary w-full"
                  >
                    {isForgotBusy ? 'Resetting Password…' : 'Reset Password'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="btn-ghost text-xs w-full py-1 text-center font-medium text-ink-500 dark:text-zinc-400"
                  >
                    Cancel & Back to Login
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {mode === 'login' && (
          <p className="text-center text-sm text-ink-500 dark:text-zinc-400 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-sage font-semibold hover:text-sage-dark hover:underline transition-all duration-200">
              Create Account
            </Link>
          </p>
        )}

      </div>
    </div>
  )
}

export default Login
