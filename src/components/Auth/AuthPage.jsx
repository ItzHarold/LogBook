import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

// ─── Helpers ─────────────────────────────────────────────────

function humanizeError(message = '') {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.'
  if (message.includes('Email not confirmed'))       return 'Please confirm your email before signing in.'
  if (message.includes('User already registered'))   return 'An account with this email already exists.'
  if (message.includes('Password should be'))        return 'Password must be at least 6 characters.'
  if (message.includes('Unable to validate email'))  return 'Please enter a valid email address.'
  return message
}

// ─── Component ───────────────────────────────────────────────

export default function AuthPage() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const isSignUp = mode === 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setSuccessMsg('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
        setPassword('')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(humanizeError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(isSignUp ? 'signin' : 'signup')
    setError('')
    setSuccessMsg('')
    setPassword('')
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>📓</span>
          <span style={styles.logoText}>LogBook</span>
        </div>

        <h1 style={styles.heading}>
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p style={styles.sub}>
          {isSignUp
            ? 'Your smart work journal starts here.'
            : 'Sign in to continue your journal.'}
        </p>

        {successMsg && (
          <div style={styles.successBanner}>
            <span>✓</span> {successMsg}
          </div>
        )}

        {error && (
          <div style={styles.errorBanner}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`input ${error ? 'input-error' : ''}`}
              placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '44px', marginTop: '4px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading
              ? <div className="spinner" style={{ borderTopColor: '#0f0f13' }} />
              : isSignUp ? 'Create account' : 'Sign in'
            }
          </button>
        </form>

        <p style={styles.toggleRow}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button onClick={toggleMode} style={styles.toggleBtn}>
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>

      <div style={styles.glow} aria-hidden />
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,192,96,0.06) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeIn 0.3s ease both',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
  },
  logoIcon: { fontSize: '26px' },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    color: 'var(--accent)',
    letterSpacing: '-0.01em',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: '26px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  sub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  successBanner: {
    background: 'var(--green-dim)',
    border: '1px solid rgba(74, 222, 128, 0.2)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--green)',
    padding: '10px 14px',
    fontSize: '13px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  errorBanner: {
    background: 'var(--red-dim)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--red)',
    padding: '10px 14px',
    fontSize: '13px',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  toggleRow: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '24px',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    padding: 0,
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    textUnderlineOffset: '3px',
  },
}
