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

function Field({ label, id, required, error, children }) {
  return (
    <div style={styles.fieldWrap}>
      <label className="label" htmlFor={id}>
        {label}
        {required && <span style={{ color: 'var(--accent)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

// Renders a single custom field input based on its type
function DynamicField({ field, value, onChange, error }) {
  const id = `cf_${field.field_key}`

  const input = (() => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={id}
            className={`input ${error ? 'input-error' : ''}`}
            style={styles.textarea}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}…`}
          />
        )
      case 'text':
        return (
          <input
            id={id}
            type="text"
            className={`input ${error ? 'input-error' : ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}…`}
          />
        )
      case 'number':
        return (
          <input
            id={id}
            type="number"
            className={`input ${error ? 'input-error' : ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            step="any"
          />
        )
      case 'date':
        return (
          <input
            id={id}
            type="date"
            className={`input ${error ? 'input-error' : ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case 'time':
        return (
          <input
            id={id}
            type="time"
            className={`input ${error ? 'input-error' : ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      case 'select':
        return (
          <select
            id={id}
            className={`input ${error ? 'input-error' : ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">— Select —</option>
            {(field.options ?? []).map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <label style={styles.checkboxLabel} htmlFor={id}>
            <input
              id={id}
              type="checkbox"
              style={styles.checkbox}
              checked={value === true || value === 'true'}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span style={styles.checkboxText}>{value ? 'Yes' : 'No'}</span>
          </label>
        )
      default:
        return null
    }
  })()

  return (
    <div style={styles.fieldWrap}>
      <label className="label" htmlFor={id}>
        {field.label}
        {field.required && <span style={{ color: 'var(--accent)', marginLeft: '3px' }}>*</span>}
      </label>
      {input}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

export default function NewEntry({ profile, addEntry, setPage, gDrive, activeFields = [] }) {
  const blankCoreForm = () => ({
    date:     today(),
    hours:    '',
    energy:   'green',
    location: profile?.default_location ?? '',
  })

  const blankCustomData = () => {
    const data = {}
    activeFields.forEach((f) => { data[f.field_key] = f.type === 'checkbox' ? false : '' })
    return data
  }

  const [coreForm, setCoreForm]     = useState(blankCoreForm())
  const [customData, setCustomData] = useState(blankCustomData())
  const [errors, setErrors]         = useState({})
  const [saving, setSaving]         = useState(false)
  const [savedEntry, setSavedEntry] = useState(null)
  const [gDriveSuccess, setGDriveSuccess] = useState('')

  const setCore = (field) => (e) => {
    setCoreForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const setCustom = (key, value) => {
    setCustomData((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!coreForm.date)  errs.date = 'Date is required.'
    if (!coreForm.hours || isNaN(coreForm.hours) || +coreForm.hours <= 0)
      errs.hours = 'Enter a valid number of hours (e.g. 7.5).'
    if (+coreForm.hours > 24) errs.hours = 'Hours cannot exceed 24.'
    if (!coreForm.location.trim()) errs.location = 'Location is required.'
    activeFields.forEach((f) => {
      if (f.required) {
        const val = customData[f.field_key]
        if (f.type === 'checkbox') return // checkboxes can't be "empty"
        if (!val || (typeof val === 'string' && !val.trim())) {
          errs[f.field_key] = `${f.label} is required.`
        }
      }
    })
    return errs
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const entry = await addEntry({
        date:        coreForm.date,
        hours:       parseFloat(coreForm.hours),
        energy:      coreForm.energy,
        location:    coreForm.location.trim(),
        custom_data: customData,
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
    gDrive.clearUploadError?.()
    setGDriveSuccess('')
    const ok = await gDrive.uploadPDF(savedEntry, profile)
    if (ok) setGDriveSuccess('Saved to your Google Drive LogBook folder ✓')
  }

  const handleClear = () => {
    setCoreForm(blankCoreForm())
    setCustomData(blankCustomData())
    setErrors({})
    setSavedEntry(null)
    setGDriveSuccess('')
    gDrive.clearUploadError?.()
  }

  // ── Success screen ──
  if (savedEntry) {
    return (
      <div className="page-fade">
        <div style={styles.successWrap}>
          <div className="card" style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Entry saved!</h2>
            <p style={styles.successSub}>
              Your log for {new Date(savedEntry.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })} has been saved.
            </p>

            <div style={styles.pdfNote}>
              <span style={{ color: 'var(--green)', marginRight: '6px' }}>✓</span>
              PDF downloaded automatically.
            </div>

            <div style={styles.gDriveSection}>
              <p style={styles.gDriveLabel}>Save to Google Drive</p>
              {!gDrive.isConnected ? (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Connect Google Drive to save PDFs automatically.
                  </p>
                  <GDriveConnect isConnected={false} connect={gDrive.connect} disconnect={gDrive.disconnect} />
                </div>
              ) : gDriveSuccess ? (
                <div style={styles.gDriveSuccessBanner}><span>☁</span> {gDriveSuccess}</div>
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

  // ── Entry form ──
  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Entry</h1>
          <p className="page-sub">Log your work day for {profile.logbook_name}</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Core fields */}
        <div className="card" style={styles.section}>
          <h2 style={styles.sectionTitle}>General</h2>
          <div className="top-grid" style={styles.topGrid}>
            <Field label="Date" id="date" required error={errors.date}>
              <input
                id="date" type="date"
                className={`input ${errors.date ? 'input-error' : ''}`}
                value={coreForm.date} onChange={setCore('date')} max={today()}
              />
            </Field>
            <Field label="Hours worked" id="hours" required error={errors.hours}>
              <input
                id="hours" type="number"
                className={`input ${errors.hours ? 'input-error' : ''}`}
                placeholder="e.g. 7.5" value={coreForm.hours} onChange={setCore('hours')}
                step="0.5" min="0.5" max="24"
              />
            </Field>
            <Field label="Energy level" id="energy" required>
              <select
                id="energy" className="input"
                value={coreForm.energy} onChange={setCore('energy')}
                style={{ cursor: 'pointer' }}
              >
                {ENERGY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Location" id="location" required error={errors.location}>
              <input
                id="location" type="text"
                className={`input ${errors.location ? 'input-error' : ''}`}
                placeholder="e.g. Office, Remote"
                value={coreForm.location} onChange={setCore('location')}
              />
            </Field>
          </div>
        </div>

        {/* Custom fields */}
        {activeFields.length > 0 && (
          <div className="card" style={{ ...styles.section, marginTop: '16px' }}>
            <h2 style={styles.sectionTitle}>Details</h2>
            <div style={styles.customGrid}>
              {activeFields.map((field) => (
                <DynamicField
                  key={field.field_key}
                  field={field}
                  value={customData[field.field_key]}
                  onChange={(val) => setCustom(field.field_key, val)}
                  error={errors[field.field_key]}
                />
              ))}
            </div>
          </div>
        )}

        {errors.submit && (
          <div style={styles.submitError}>{errors.submit}</div>
        )}

        <div style={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={saving}>
            Clear
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: '180px' }}>
            {saving
              ? <><div className="spinner" style={{ borderTopColor: '#0f0f13' }} /> Saving...</>
              : '✦ Save & Download PDF'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  section: { padding: '24px 26px' },
  sectionTitle: {
    fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '20px',
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
  },
  customGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  textarea: { resize: 'vertical', minHeight: '96px', lineHeight: 1.7 },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
    padding: '10px 14px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', width: 'fit-content',
  },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' },
  checkboxText: { fontSize: '14px', color: 'var(--text-primary)' },
  actions: {
    display: 'flex', gap: '12px', justifyContent: 'flex-end',
    marginTop: '20px', paddingBottom: '40px',
  },
  submitError: {
    background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 'var(--radius-sm)', color: 'var(--red)',
    padding: '10px 14px', fontSize: '13px', marginTop: '16px',
  },
  successWrap: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px' },
  successCard: { maxWidth: '460px', width: '100%', textAlign: 'center', padding: '40px 36px' },
  successIcon: {
    width: '52px', height: '52px', borderRadius: '50%',
    background: 'var(--green-dim)', border: '1px solid rgba(74,222,128,0.25)',
    color: 'var(--green)', fontSize: '22px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: {
    fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 600,
    color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.01em',
  },
  successSub: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' },
  pdfNote: {
    background: 'var(--green-dim)', border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: 'var(--radius-sm)', padding: '8px 14px',
    fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'left',
  },
  gDriveSection: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '16px', marginBottom: '24px', textAlign: 'left',
  },
  gDriveLabel: {
    fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px',
  },
  gDriveSuccessBanner: {
    background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    fontSize: '13px', color: 'var(--green)', display: 'flex', gap: '8px',
  },
  successActions: { display: 'flex', gap: '12px', justifyContent: 'center' },
}
