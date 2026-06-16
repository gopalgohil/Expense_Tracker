import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { forgotPassword, verifyOTP, resetPassword } from '../api/client'

const EyeIcon = ({ visible }) => visible ? (
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
)

const eyeBtnStyle = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
}

const ForgotPassword = () => {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Reset Password, 4: Success
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [passwords, setPasswords] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()

  const validateEmail = (emailVal) => {
    if (!emailVal || !emailVal.trim()) {
      return 'Email is required.'
    }
    const emailRegex = /^[^\s@]+@gmail\.(com|in)$/i
    if (!emailRegex.test(emailVal.trim())) {
      return 'Please enter a valid Gmail address.'
    }
    return null
  }

  // Handle Step 1: Submit Email
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    const emailError = validateEmail(email)
    if (emailError) {
      setErrors({ email: emailError })
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const response = await forgotPassword({ email: email.trim() })
      setLoading(false)
      toast.success(response.data?.message || 'OTP sent successfully!')
      setStep(2)
    } catch (err) {
      setLoading(false)
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.'
      setErrors({ email: msg })
      toast.error(msg)
    }
  }

  // Handle Step 2: Submit OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (!otp || otp.trim().length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit verification code.' })
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const response = await verifyOTP({ email: email.trim(), otp: otp.trim() })
      setLoading(false)
      toast.success(response.data?.message || 'OTP verified!')
      setStep(3)
    } catch (err) {
      setLoading(false)
      const msg = err.response?.data?.message || 'Verification failed. Incorrect OTP.'
      setErrors({ otp: msg })
      toast.error(msg)
    }
  }

  // Handle Step 3: Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!passwords.password) {
      errs.password = 'New password is required.'
    } else if (passwords.password.length < 6) {
      errs.password = 'Password must be at least 6 characters long.'
    }
    if (!passwords.confirm) {
      errs.confirm = 'Please confirm your password.'
    } else if (passwords.confirm !== passwords.password) {
      errs.confirm = 'Passwords do not match.'
    }

    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const response = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: passwords.password,
      })
      setLoading(false)
      toast.success(response.data?.message || 'Password reset successful!')
      setStep(4)
    } catch (err) {
      setLoading(false)
      const msg = err.response?.data?.message || 'Failed to reset password.'
      setErrors({ password: msg })
      toast.error(msg)
    }
  }

  // Password strength meter
  const strength = (() => {
    const p = passwords.password
    if (!p) return null
    let s = 0
    if (p.length >= 6)           s++
    if (p.length >= 10)          s++
    if (/[A-Z]/.test(p))        s++
    if (/[0-9]/.test(p))        s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    if (s <= 2) return { label: 'Weak',   color: '#ef4444', w: '33%'  }
    if (s <= 3) return { label: 'Medium', color: '#eab308', w: '66%'  }
    return              { label: 'Strong', color: '#22c55e', w: '100%' }
  })()

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-11 h-11 bg-sage rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink-800">Reset your password</h1>
          <p className="text-sm text-ink-400 mt-1">We'll help you secure your account</p>
        </div>

        <div className="card p-6">
          
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label">Registered Email Address</label>
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors({})
                  }}
                  className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                />
                {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.email}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending OTP…' : 'Send Verification OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
              <div className="p-3 bg-sage-light text-sage rounded-xl text-xs leading-relaxed">
                We sent a secure 6-digit OTP code to <strong className="font-semibold">{email}</strong>. It will expire in 10 minutes.
              </div>
              <div>
                <label className="label">6-Digit Verification OTP</label>
                <input
                  type="text"
                  placeholder="Enter OTP code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    // Only numbers
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setOtp(val)
                    setErrors({})
                  }}
                  className={`input-field font-mono text-center text-lg tracking-widest ${errors.otp ? 'border-red-400' : ''}`}
                />
                {errors.otp && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.otp}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying OTP…' : 'Verify OTP'}
              </button>
              <div className="flex justify-between items-center text-xs mt-2">
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  className="text-sage font-medium hover:text-sage-dark"
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setErrors({})
                  }}
                  className="text-ink-400 hover:text-ink-600 font-medium"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={passwords.password}
                    onChange={(e) => {
                      setPasswords(prev => ({ ...prev, password: e.target.value }))
                      setErrors(prev => ({ ...prev, password: '' }))
                    }}
                    className={`input-field ${errors.password ? 'border-red-400' : ''}`}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPass(p => !p)}
                    style={eyeBtnStyle}>
                    <EyeIcon visible={showPass} />
                  </button>
                </div>
                {strength && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 4, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: strength.w, background: strength.color, borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: 11, color: strength.color, marginTop: 2 }}>{strength.label} password</p>
                  </div>
                )}
                {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.password}</p>}
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={passwords.confirm}
                    onChange={(e) => {
                      setPasswords(prev => ({ ...prev, confirm: e.target.value }))
                      setErrors(prev => ({ ...prev, confirm: '' }))
                    }}
                    className={`input-field ${errors.confirm ? 'border-red-400' : ''}`}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowConfirm(p => !p)}
                    style={eyeBtnStyle}>
                    <EyeIcon visible={showConfirm} />
                  </button>
                </div>
                {passwords.confirm && (
                  <p style={{ fontSize: 12, marginTop: 4, color: passwords.confirm === passwords.password ? '#16a34a' : '#ef4444' }}>
                    {passwords.confirm === passwords.password ? '✅ Passwords match' : '❌ Passwords do not match'}
                  </p>
                )}
                {errors.confirm && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.confirm}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Resetting Password…' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-ink-800">Password reset successful!</h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                Your password has been changed successfully. You can now use your new password to sign in.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-primary w-full mt-2"
              >
                Go to Sign In
              </button>
            </div>
          )}

        </div>

        {step !== 4 && (
          <p className="text-center text-sm text-ink-400 mt-4">
            Remembered your password?{' '}
            <Link to="/login" className="text-sage font-medium hover:text-sage-dark">Sign in</Link>
          </p>
        )}

      </div>
    </div>
  )
}

export default ForgotPassword
