import { createPortal } from 'react-dom'
import { useState } from 'react'
import FieldBuilder from '../Logbooks/FieldBuilder'

export default function LogbookModal({ mode, target, onClose, addLogbook, deleteLogbook }) {
  const [form, setForm]     = useState({ name: '', organization: '', default_location: '' })
  const [fields, setFields] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Logbook name is required.'); return }
    const invalid = fields.find((f) => !f.label.trim())
    if (invalid) { setError('All fields must have a name.'); return }
    // Check for duplicate field names
    const labels = fields.map((f) => f.label.trim().toLowerCase())
    const dup = labels.find((l, i) => labels.indexOf(l) !== i)
    if (dup) { setError(`You have two fields both named "${fields.find((f,i) => labels.indexOf(f.label.trim().toLowerCase()) !== i)?.label}". Each field must have a unique name.`); return }
    setSaving(true)
    setError('')
    try {
      await addLogbook({
        name:             form.name.trim(),
        organization:     form.organization.trim(),
        default_location: form.default_location.trim(),
        fields,
      })
      onClose()
    } catch (err) {
      const msg = err.message ?? ''
      setError(
        msg.includes('duplicate key')
          ? 'Two or more fields have the same name. Please give each field a unique name.'
          : msg || 'Failed to create logbook.'
      )
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    setError('')
    try {
      await deleteLogbook(target.id)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to delete logbook.')
      setSaving(false)
    }
  }

  const content = (
    /* Full-viewport scroll container — this is what scrolls, not the card */
    <div style={styles.scrollContainer} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={styles.modal} role="dialog" aria-modal="true">

        {mode === 'create' ? (
          <>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New logbook</h2>
              <button style={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={styles.formFields}>
                <div style={styles.field}>
                  <label className="label" htmlFor="lb-name">Name *</label>
                  <input
                    id="lb-name" className="input"
                    placeholder="e.g. Internship Log"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div style={styles.field}>
                  <label className="label" htmlFor="lb-org">Organisation</label>
                  <input
                    id="lb-org" className="input"
                    placeholder="e.g. Acme Corp"
                    value={form.organization}
                    onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                  />
                </div>
                <div style={styles.field}>
                  <label className="label" htmlFor="lb-loc">Default location</label>
                  <input
                    id="lb-loc" className="input"
                    placeholder="e.g. Office, Remote"
                    value={form.default_location}
                    onChange={(e) => setForm((f) => ({ ...f, default_location: e.target.value }))}
                  />
                </div>
              </div>

              <div style={styles.fieldBuilderWrap}>
                <FieldBuilder fields={fields} onChange={setFields} />
              </div>

              {error && <p style={styles.errorText}>⚠ {error}</p>}

              <div style={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '140px' }} disabled={saving}>
                  {saving
                    ? <div className="spinner" style={{ borderTopColor: '#0f0f13' }} />
                    : 'Create logbook'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Delete logbook</h2>
              <button style={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <div style={styles.deleteBody}>
              <div style={styles.deleteIcon}>🗑</div>
              <p style={styles.deleteTitle}>"{target?.name}"</p>
              <p style={styles.deleteWarning}>
                This permanently deletes the logbook, all its entries, and custom fields.
                This cannot be undone.
              </p>
            </div>

            {error && <p style={{ ...styles.errorText, textAlign: 'center' }}>⚠ {error}</p>}

            <div style={styles.modalActions}>
              <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ minWidth: '160px' }} onClick={handleDelete} disabled={saving}>
                {saving
                  ? <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--red)' }} />
                  : 'Yes, delete everything'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )

  return createPortal(content, document.body)
}

const styles = {
  /* Covers the whole viewport, scrollable, centers the card */
  scrollContainer: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0,0,0,0.65)',
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px 48px',
    animation: 'fadeIn 0.15s ease both',
  },
  modal: {
    width: '100%',
    maxWidth: '540px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '28px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    animation: 'slideUp 0.2s cubic-bezier(0.32,0.72,0,1) both',
    /* Never a fixed height — grows with content */
    flexShrink: 0,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  modalTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    lineHeight: 1,
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: { display: 'flex', flexDirection: 'column' },
  fieldBuilderWrap: {
    borderTop: '1px solid var(--border)',
    paddingTop: '20px',
    marginTop: '20px',
  },
  errorText: {
    fontSize: '13px',
    color: 'var(--red)',
    marginTop: '12px',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border)',
  },
  deleteBody: {
    textAlign: 'center',
    padding: '12px 0 24px',
  },
  deleteIcon: {
    fontSize: '36px',
    marginBottom: '14px',
  },
  deleteTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  deleteWarning: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: '360px',
    margin: '0 auto',
  },
}
