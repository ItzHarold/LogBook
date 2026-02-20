import { useState } from 'react'
import { generatePDF } from '../lib/generatePDF'
import GDriveConnect from '../components/GDrive/GDriveConnect'

function today() {
  return new Date().toISOString().split('T')[0]
}

const ENERGY_OPTIONS = [
  { value: 'green',  label: '🟢  High energy' },
  { value: 'yellow', label: '🟡  Medium energy' },
  { value: 'red',    label: '🔴  Low energy' },
]

const BLANK_FORM = (profile) => ({
  date: today(),
  hours: '',
  energy: 'green',
  location: profile?.default_location ?? '',
  worked_on: '',
  learned: '',
  blockers: '',
  ideas: '',
  tomorrow: '',
})

function Field({ label, id, required, error, children }) {
  return (
    <div style={styles.fieldWrap}>
      <label className="label" htmlFor={id}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

function TextArea({ id, value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      id={id}
      className="input"
      style={{ ...styles.textarea, height: `${rows * 24 + 22}px` }}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}

export default function NewEntry({ profile, addEntry, setPage, gDrive }) {
  const [form, setForm]           = useState(BLANK_FORM(profile))
  const [errors, setErrors]       = useState({})
  const [saving, setSaving]       = useState(false)
  const [savedEntry, setSavedEntry] = useState(null)
  const [oneDriveSuccess, setOneDriveSuccess] = useState('')

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.date) errs.date = 'Date is required.'
    if (!form.hours || isNaN(form.hours) || +form.hours <= 0) errs.hours = 'Enter a valid number of hours (e.g. 7.5).'
    if (+form.hours > 24) errs.hours = 'Hours cannot exceed 24.'
    if (!form.location.trim()) errs.location = 'Location is required.'
    return errs
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const entry = await addEntry({
        date:      form.date,
        hours:     parseFloat(form.hours),
        energy:    form.energy,
        location:  form.location.trim(),
        worked_on: form.worked_on.trim(),
        learned:   form.learned.trim(),
        blockers:  form.blockers.trim(),
        ideas:     form.ideas.trim(),
        tomorrow:  form.tomorrow.trim(),
      })
      setSavedEntry(entry)
      generatePDF(entry, profile)
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save entry. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveToGDrive = async () => {
    if (!savedEntry) return
    gDrive.clearUploadError()
    setOneDriveSuccess('')
    const ok = await gDrive.uploadPDF(savedEntry, profile)
    if (ok) setOneDriveSuccess('Saved to your Google Drive LogBook folder ✓')
  }

  const handleClear = () => {
    setForm(BLANK_FORM(profile))
    setErrors({})
    setSavedEntry(null)
    setOneDriveSuccess('')
    gDrive.clearUploadError?.()
  }

  if (savedEntry) {
    return (
      <div className="page-fade">
        <div style={styles.successWrap}>
          <div className="card" style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Entry saved!</h2>
            <p style={styles.successSub}>
              Your log for {new Date(savedEntry.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
              })} has been saved.
            </p>

            {/* PDF downloaded banner */}
            <div style={styles.pdfNote}>
              <span style={{ color: 'var(--green)', marginRight: '6px' }}>✓</span>
              PDF downloaded automatically.
            </div>

            {/* OneDrive section */}
            <div style={styles.oneDriveSection}>
              <p style={styles.oneDriveLabel}>Save to OneDrive</p>

              {!gDrive.isConnected ? (
                <div style={styles.oneDrivePrompt}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Connect your Google Drive to automatically save PDFs to a LogBook folder.
                  </p>
                  <GDriveConnect
                    isConnected={false}
                    connect={gDrive.connect}
                    disconnect={gDrive.disconnect}
                  />
                </div>
              ) : oneDriveSuccess ? (
                <div style={styles.oneDriveSuccessBanner}>
                  <span>☁</span> {oneDriveSuccess}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={handleSaveToGDrive}
                    disabled={gDrive.uploading}
                  >
                    {gDrive.uploading
                      ? <><div className="spinner" style={{ borderTopColor: 'var(--text-primary)' }} /> Uploading…</>
                      : '☁ Save to Google Drive'}
                  </button>
                  {gDrive.uploadError && (
                    <p style={{ fontSize: '12px', color: 'var(--red)' }}>⚠ {gDrive.uploadError}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <GDriveConnect
                      isConnected
                      connect={gDrive.connect}
                      disconnect={gDrive.disconnect}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={styles.successActions}>
              <button className="btn btn-secondary" onClick={handleClear}>Log another day</button>
              <button className="btn btn-primary" onClick={() => setPage('history')}>View history →</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Entry</h1>
          <p className="page-sub">Log your work day for {profile.logbook_name}</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="card" style={styles.section}>
          <h2 style={styles.sectionTitle}>General</h2>
          <div className="top-grid" style={styles.topGrid}>
            <Field label="Date" id="date" required error={errors.date}>
              <input id="date" type="date" className={`input ${errors.date ? 'input-error' : ''}`} value={form.date} onChange={set('date')} max={today()} />
            </Field>
            <Field label="Hours worked" id="hours" required error={errors.hours}>
              <input id="hours" type="number" className={`input ${errors.hours ? 'input-error' : ''}`} placeholder="e.g. 7.5" value={form.hours} onChange={set('hours')} step="0.5" min="0.5" max="24" />
            </Field>
            <Field label="Energy level" id="energy" required>
              <select id="energy" className="input" value={form.energy} onChange={set('energy')} style={{ cursor: 'pointer' }}>
                {ENERGY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Location" id="location" required error={errors.location}>
              <input id="location" type="text" className={`input ${errors.location ? 'input-error' : ''}`} placeholder="e.g. Office, Remote" value={form.location} onChange={set('location')} />
            </Field>
          </div>
        </div>

        <div className="card" style={{ ...styles.section, marginTop: '16px' }}>
          <h2 style={styles.sectionTitle}>Reflections</h2>
          <div style={styles.textGrid}>
            <Field label="What I worked on" id="worked_on">
              <TextArea id="worked_on" value={form.worked_on} onChange={set('worked_on')} placeholder="Describe the tasks, projects, or activities you worked on today..." rows={4} />
            </Field>
            <Field label="What I learned" id="learned">
              <TextArea id="learned" value={form.learned} onChange={set('learned')} placeholder="New skills, insights, concepts, or techniques you picked up..." rows={4} />
            </Field>
            <Field label="Blockers & challenges" id="blockers">
              <TextArea id="blockers" value={form.blockers} onChange={set('blockers')} placeholder="What slowed you down or got in the way? What was hard?" rows={3} />
            </Field>
            <Field label="Ideas & notes" id="ideas">
              <TextArea id="ideas" value={form.ideas} onChange={set('ideas')} placeholder="Any ideas, thoughts, observations, or things worth remembering..." rows={3} />
            </Field>
            <Field label="Tomorrow's plan" id="tomorrow">
              <TextArea id="tomorrow" value={form.tomorrow} onChange={set('tomorrow')} placeholder="What do you plan to tackle tomorrow? Any priorities or intentions?" rows={3} />
            </Field>
          </div>
        </div>

        {errors.submit && (
          <div style={styles.submitError}>{errors.submit}</div>
        )}

        <div style={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={saving}>Clear</button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: '180px' }}>
            {saving
              ? <><div className="spinner" style={{ borderTopColor: '#0f0f13' }} /> Saving...</>
              : '✦ Save & Download PDF'
            }
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  header: { marginBottom: '28px' },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '30px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  sub: { fontSize: '14px', color: 'var(--text-secondary)' },
  section: { padding: '24px 26px' },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
  },
  textGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fieldWrap: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  textarea: { resize: 'vertical', minHeight: '80px', lineHeight: 1.7 },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
    paddingBottom: '40px',
  },
  submitError: {
    background: 'var(--red-dim)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--red)',
    padding: '10px 14px',
    fontSize: '13px',
    marginTop: '16px',
  },
  successWrap: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '40px',
  },
  successCard: { maxWidth: '460px', width: '100%', textAlign: 'center', padding: '40px 36px' },
  successIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'var(--green-dim)',
    border: '1px solid rgba(74, 222, 128, 0.25)',
    color: 'var(--green)',
    fontSize: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '26px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '10px',
    letterSpacing: '-0.01em',
  },
  successSub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  pdfNote: {
    background: 'var(--green-dim)',
    border: '1px solid rgba(74, 222, 128, 0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 14px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
    textAlign: 'left',
  },
  oneDriveSection: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  oneDriveLabel: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '10px',
  },
  oneDrivePrompt: { display: 'flex', flexDirection: 'column' },
  oneDriveSuccessBanner: {
    background: 'rgba(74, 222, 128, 0.08)',
    border: '1px solid rgba(74, 222, 128, 0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--green)',
    display: 'flex',
    gap: '8px',
  },
  successActions: { display: 'flex', gap: '12px', justifyContent: 'center' },
}
