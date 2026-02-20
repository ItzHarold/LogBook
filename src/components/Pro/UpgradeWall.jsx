import { useState } from 'react'

const FEATURES = [
  { icon: '✦', text: 'AI chat with your full logbook as context' },
  { icon: '◎', text: 'Pattern detection — energy, blockers, growth' },
  { icon: '↗', text: 'Weekly summaries and personalised insights' },
  { icon: '✎', text: 'Ask anything about your work history' },
]

export default function UpgradeWall({ user, onUpgradeSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleUpgrade = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:    user.id,
          userEmail: user.email,
          origin:    window.location.origin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout.')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.glow} aria-hidden />

      <div style={styles.card}>
        <div style={styles.badge}>
          <span style={styles.badgeDot} />
          LogBook Pro
        </div>

        <h2 style={styles.heading}>Unlock AI Chat</h2>
        <p style={styles.sub}>
          Your AI assistant has read every entry in your logbook and is ready
          to surface insights, patterns, and answers — for less than a coffee a month.
        </p>

        <div style={styles.features}>
          {FEATURES.map((f, i) => (
            <div key={i} style={styles.feature}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <span style={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Price row — all on one line */}
        <div style={styles.priceRow}>
          <div style={styles.priceLeft}>
            <span style={styles.price}>€4.99</span>
            <span style={styles.pricePer}>/mo</span>
          </div>
          <span style={styles.priceSub}>cancel any time</span>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <span>⚠</span> {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={styles.cta}
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading
            ? <><div className="spinner" style={{ borderTopColor: '#0f0f13' }} /> Redirecting…</>
            : 'Upgrade to Pro →'
          }
        </button>

        <p style={styles.legal}>
          Secure payment via Stripe. Cancel any time from your account settings.
        </p>
      </div>
    </div>
  )
}

const styles = {
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '16px 0',
  },
  glow: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,192,96,0.07) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'var(--bg-card)',
    border: '1px solid rgba(240, 192, 96, 0.2)',
    borderRadius: 'var(--radius-xl)',
    padding: 'clamp(24px, 5vw, 40px) clamp(20px, 6vw, 44px)',
    width: '100%',
    maxWidth: '480px',
    animation: 'fadeIn 0.3s ease both',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(240, 192, 96, 0.25)',
    borderRadius: '99px',
    padding: '4px 14px',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '18px',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent)',
    display: 'inline-block',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(22px, 5vw, 28px)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '10px',
  },
  sub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: '24px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
  },
  feature: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    fontSize: '14px',
  },
  featureIcon: {
    color: 'var(--accent)',
    fontSize: '14px',
    flexShrink: 0,
    marginTop: '1px',
    width: '16px',
    textAlign: 'center',
  },
  featureText: {
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '8px',
  },
  priceLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  price: {
    fontFamily: 'var(--font-heading)',
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '-0.02em',
  },
  pricePer: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
  },
  priceSub: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '99px',
    padding: '3px 10px',
    whiteSpace: 'nowrap',
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
    marginBottom: '16px',
  },
  cta: {
    width: '100%',
    height: '48px',
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  legal: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
}
