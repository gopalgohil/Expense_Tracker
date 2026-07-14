import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile, changePassword, deleteAccount } from '../api/client'
import { useNavigate } from 'react-router-dom'
import ScaleModal from '../components/animations/ScaleModal'
import { HoverButton } from '../components/animations/HoverButton'
import hashPassword from '../utils/hashPassword'

const CURRENCIES = [
  { code: 'INR', label: '🇮🇳 INR — Indian Rupee' },
  { code: 'USD', label: '🇺🇸 USD — US Dollar' },
  { code: 'EUR', label: '🇪🇺 EUR — Euro' },
  { code: 'GBP', label: '🇬🇧 GBP — British Pound' },
  { code: 'JPY', label: '🇯🇵 JPY — Japanese Yen' },
  { code: 'CAD', label: '🇨🇦 CAD — Canadian Dollar' },
  { code: 'AUD', label: '🇦🇺 AUD — Australian Dollar' },
  { code: 'SGD', label: '🇸🇬 SGD — Singapore Dollar' },
  { code: 'CHF', label: '🇨🇭 CHF — Swiss Franc' },
  { code: 'NZD', label: '🇳🇿 NZD — New Zealand Dollar' },
  { code: 'HKD', label: '🇭🇰 HKD — Hong Kong Dollar' },
  { code: 'CNY', label: '🇨🇳 CNY — Chinese Yuan' },
  { code: 'MXN', label: '🇲🇽 MXN — Mexican Peso' },
  { code: 'BRL', label: '🇧🇷 BRL — Brazilian Real' },
  { code: 'ZAR', label: '🇿🇦 ZAR — South African Rand' },
  { code: 'SEK', label: '🇸🇪 SEK — Swedish Krona' },
  { code: 'NOK', label: '🇳🇴 NOK — Norwegian Krone' },
  { code: 'DKK', label: '🇩🇰 DKK — Danish Krone' },
  { code: 'THB', label: '🇹🇭 THB — Thai Baht' },
  { code: 'MYR', label: '🇲🇾 MYR — Malaysian Ringgit' },
]

// ── Reusable components defined OUTSIDE Settings ──────────────
// (if defined inside, React recreates them on every render → input loses focus)

const Section = ({ title, children }) => (
  <div className="card p-6 space-y-4">
    <h3 className="text-base font-semibold text-ink-800 border-b border-ink-100 pb-3">{title}</h3>
    {children}
  </div>
)

const EyeBtn = ({ show, toggle }) => (
  <button
    type="button"
    onClick={toggle}
    tabIndex={-1}
    style={{
      position: 'absolute', right: 12, top: '50%',
      transform: 'translateY(-50%)', background: 'none',
      border: 'none', cursor: 'pointer', padding: 0,
      color: '#9ca3af', display: 'flex',
    }}
  >
    {show ? (
      <svg width="18" height="18" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg width="18" height="18" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )}
  </button>
)

const PwdField = ({ label, name, show, toggle, value, onChange, error }) => (
  <div>
    <label className="label">{label}</label>
    <div style={{ position: 'relative' }}>
      <input
        name={name}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        autoComplete="off"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        className={`input-field ${error ? 'border-red-400' : ''}`}
        style={{ paddingRight: 40 }}
      />
      <EyeBtn show={show} toggle={toggle} />
    </div>
    {error && (
      <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>⚠ {error}</p>
    )}
  </div>
)

const ProfileField = ({ label, name, type = 'text', value, onChange, placeholder, error }) => (
  <div>
    <label className="label">{label}</label>
    <input
      name={name} type={type} value={value}
      onChange={onChange} placeholder={placeholder}
      className={`input-field ${error ? 'border-red-400' : ''}`}
    />
    {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>⚠ {error}</p>}
  </div>
)

// ── Main Settings component ────────────────────────────────────
const Settings = () => {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  // Profile state
  const [profile,       setProfile]       = useState({ name: user?.name || '', email: user?.email || '', currency: user?.currency || 'INR' })
  const [profileErr,    setProfileErr]    = useState({})
  const [profileSaving, setProfileSaving] = useState(false)

  // Password state
  const [pwd,      setPwd]      = useState({ current: '', newPass: '', confirm: '' })
  const [pwdErr,   setPwdErr]   = useState({})
  const [pwdSaving, setPwdSaving] = useState(false)
  const [showCur,  setShowCur]  = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [showCon,  setShowCon]  = useState(false)

  // Delete state
  const [showDelete, setShowDelete] = useState(false)
  const [deletePass, setDeletePass] = useState('')
  const [deleteErr,  setDeleteErr]  = useState('')
  const [deleting,   setDeleting]   = useState(false)

  // ── Profile handlers ──
  const handleProfileChange = (e) => {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }))
    setProfileErr((p) => ({ ...p, [e.target.name]: '' }))
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!profile.name.trim())  errs.name  = 'Name is required.'
    if (!profile.email.trim()) errs.email = 'Email is required.'
    if (Object.keys(errs).length) { setProfileErr(errs); return }

    setProfileSaving(true)
    try {
      const { data } = await updateUserProfile(profile)
      updateUser(data)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.')
    } finally { setProfileSaving(false) }
  }

  // ── Password handlers ──
  const handlePwdChange = (e) => {
    setPwd((p) => ({ ...p, [e.target.name]: e.target.value }))
    setPwdErr((p) => ({ ...p, [e.target.name]: '' }))
  }

  const handlePwdSave = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwd.current)               errs.current = 'Current password is required.'
    if (!pwd.newPass)               errs.newPass = 'New password is required.'
    else if (pwd.newPass.length < 6) errs.newPass = 'Must be at least 6 characters.'
    if (!pwd.confirm)               errs.confirm = 'Please confirm new password.'
    else if (pwd.confirm !== pwd.newPass) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length)   { setPwdErr(errs); return }

    setPwdSaving(true)
    try {
      const hashedCurrent = await hashPassword(pwd.current)
      const hashedNew     = await hashPassword(pwd.newPass)
      await changePassword({ currentPassword: hashedCurrent, newPassword: hashedNew })
      toast.success('Password changed successfully!')
      setPwd({ current: '', newPass: '', confirm: '' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.'
      if (msg.toLowerCase().includes('current')) setPwdErr({ current: msg })
      else toast.error(msg)
    } finally { setPwdSaving(false) }
  }

  // ── Delete handler ──
  const handleDeleteAccount = async () => {
    if (!deletePass) { setDeleteErr('Please enter your password.'); return }
    setDeleting(true)
    try {
      const hashedPass = await hashPassword(deletePass)
      await deleteAccount({ password: hashedPass })
      // Only redirect on SUCCESS
      toast.success('Account deleted successfully.')
      logout()
      navigate('/login')
    } catch (err) {
      // Stay on modal — show error in red text, do NOT redirect
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setDeleteErr(msg)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-ink-800">Settings</h2>
        <p className="text-sm text-ink-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* ── Profile ── */}
      <Section title="Profile Information">
        <form onSubmit={handleProfileSave} className="space-y-4" noValidate>
          <ProfileField
            label="Full Name" name="name" value={profile.name}
            onChange={handleProfileChange} placeholder="Your name"
            error={profileErr.name}
          />
          <ProfileField
            label="Email Address" name="email" type="email" value={profile.email}
            onChange={handleProfileChange} placeholder="you@example.com"
            error={profileErr.email}
          />

          {/* Currency selector */}
          <div>
            <label className="label">Base Currency</label>
            <select
              name="currency"
              value={profile.currency}
              onChange={handleProfileChange}
              className="input-field bg-white dark:bg-zinc-800 text-ink-800 dark:text-zinc-100"
            >
              {CURRENCIES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <p className="text-xs text-ink-400 mt-1">All dashboard totals and charts will be shown in this currency.</p>
          </div>

          <button type="submit" disabled={profileSaving} className="btn-primary">
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* ── Change Password ── */}
      <Section title="Change Password">
        <form onSubmit={handlePwdSave} className="space-y-4" noValidate>
          <PwdField
            label="Current Password" name="current"
            show={showCur} toggle={() => setShowCur((p) => !p)}
            value={pwd.current} onChange={handlePwdChange}
            error={pwdErr.current}
          />
          <PwdField
            label="New Password" name="newPass"
            show={showNew} toggle={() => setShowNew((p) => !p)}
            value={pwd.newPass} onChange={handlePwdChange}
            error={pwdErr.newPass}
          />
          <PwdField
            label="Confirm New Password" name="confirm"
            show={showCon} toggle={() => setShowCon((p) => !p)}
            value={pwd.confirm} onChange={handlePwdChange}
            error={pwdErr.confirm}
          />
          {pwd.confirm && (
            <p style={{ fontSize: 12, color: pwd.confirm === pwd.newPass ? '#16a34a' : '#dc2626' }}>
              {pwd.confirm === pwd.newPass ? '✅ Passwords match' : '❌ Passwords do not match'}
            </p>
          )}
          <button type="submit" disabled={pwdSaving} className="btn-primary">
            {pwdSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </Section>

      {/* ── Danger Zone ── */}
      <div className="card p-6 border border-red-200">
        <h3 className="text-base font-semibold text-red-600 border-b border-red-100 pb-3 mb-4">
          ⚠ Danger Zone
        </h3>
        <p className="text-sm text-ink-500 mb-4">
          Permanently delete your account and all your data — expenses, budgets, everything.
          This action <strong>cannot be undone</strong>.
        </p>
        <button
          onClick={() => setShowDelete(true)}
          className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
        >
          Delete My Account
        </button>
      </div>

      {/* ── Delete Modal ── */}
      <ScaleModal open={showDelete} onClose={() => { setShowDelete(false); setDeletePass(''); setDeleteErr('') }} maxWidth="max-w-md">
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink-800 mb-2">Delete Account?</h3>
          <p className="text-sm text-ink-400 mb-5 leading-relaxed">
            All your expenses, budgets and data will be permanently deleted.
            Enter your password to confirm.
          </p>
          <div className="mb-4 text-left">
            <input
              type="password"
              placeholder="Enter your password"
              value={deletePass}
              onChange={(e) => { setDeletePass(e.target.value); setDeleteErr('') }}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              className="input-field"
            />
            {deleteErr && <p className="text-red-600 text-xs mt-1">⚠ {deleteErr}</p>}
          </div>
          <HoverButton
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-sm mb-2 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Yes, Delete My Account'}
          </HoverButton>
          <HoverButton
            onClick={() => { setShowDelete(false); setDeletePass(''); setDeleteErr('') }}
            className="w-full py-2.5 rounded-xl bg-ink-50 text-ink-600 font-medium text-sm"
          >
            Cancel
          </HoverButton>
        </div>
      </ScaleModal>
    </div>
  )
}

export default Settings
