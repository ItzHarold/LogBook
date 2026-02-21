import { useState } from 'react'

const STEPS = [
  {
    id: 'name',
    field: 'name',
    number: '01',
    question: "What's your name?",
    hint: 'Used in your PDF entries and your AI assistant greeting.',
    placeholder: 'e.g. Alex Johnson',
  },
  {
    id: 'organization',
    field: 'organization',
    number: '02',
    question: "Where are you based?",
    hint: 'Your company, school, or organization name.',
    placeholder: 'e.g. Acme Corp, University of Amsterdam',
  },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep]     = useState(0)
  const [values, setValues] = useState({ name: '', organization: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [current.field]: e.target.value }))
    setError('')
  }

  const handleNext = async (e) => {
    e.preventDefault()
    const val = values[current.field].trim()
    if (!val) { setError('Please fill this in before continuing.'); return }

    if (isLast) {
      setLoading(true)
      setError('')
      try {
        await onComplete({ ...values, [current.field]: val })
      } catch (err) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
      }
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div style={styles.inner}>
        <div style={styles.stepChip}>Step {step + 1} of {STEPS.length}</div>
        <h1 style={styles.question}>{current.question}</h1>
        <p style={styles.hint}>{current.hint}</p>

        <form onSubmit={handleNext} style={styles.form}>
          <input
            key={current.id}
            type="text"
            className="input"
            style={styles.input}
            placeholder={current.placeholder}
            value={values[current.field]}
            onChange={handleChange}
            autoFocus
          />

          {error && <p className="error-text" style={{ marginTop: '10px' }}>{error}</p>}

          <div style={styles.actions}>
            {step > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setStep((s) => s - 1); setError('') }}
                disabled={loading}
                style={{ minWidth: '100px' }}
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !values[current.field].trim()}
              style={{ minWidth: '160px' }}
            >
              {loading
                ? <div className="spinner" style={{ borderTopColor: '#0f0f13' }} />
                : isLast ? 'Get started →' : 'Continue →'}
            </button>
          </div>
        </form>

        <div style={styles.dots}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              style={{
                ...styles.dot,
                ...(i === step ? styles.dotActive : {}),
                ...(i < step  ? styles.dotDone  : {}),
              }}
            />
          ))}
        </div>
      </div>

      <div style={styles.glow} aria-hidden />
    </div>
  )
}

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
  progressTrack: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: '3px',
    background: 'var(--border)',
    zIndex: 10,
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: '0 99px 99px 0',
    transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
  },
  inner: {
    width: '100%',
    maxWidth: '520px',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeIn 0.3s ease both',
  },
  stepChip: {
    display: 'inline-block',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(240,192,96,0.2)',
    borderRadius: '99px',
    padding: '4px 14px',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '28px',
  },
  question: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(26px, 5vw, 38px)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    marginBottom: '12px',
  },
  hint: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    marginBottom: '36px',
    lineHeight: 1.6,
  },
  form: { display: 'flex', flexDirection: 'column' },
  input: { fontSize: '17px', padding: '14px 18px', height: '56px' },
  actions: { display: 'flex', gap: '12px', marginTop: '24px' },
  dots: { display: 'flex', gap: '8px', marginTop: '48px' },
  dot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: 'var(--border-hover)',
    transition: 'all 0.25s ease',
  },
  dotActive: { background: 'var(--accent)', transform: 'scale(1.25)' },
  dotDone:   { background: 'rgba(240,192,96,0.35)' },
  glow: {
    position: 'absolute',
    width: '700px', height: '700px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,192,96,0.05) 0%, transparent 70%)',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
}
