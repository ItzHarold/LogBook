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
      setError(err.message ?? 'Failed to create logbook.')
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
    <>
      {/* Backdrop — covers true viewport */}
      <div style={styles.backdrop} onClick={onClose} />

      {/* Modal — centered in true viewport */}
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
    </>
  )

  // Portal into body so position:fixed is always relative to the true viewport
  return createPortal(content, document.body)
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    zIndex: 1000,
    animation: 'fadeIn 0.15s ease both',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(560px, calc(100vw - 32px))',
    maxHeight: 'calc(100dvh - 48px)',
    overflowY: 'auto',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '28px',
    zIndex: 1001,
    animation: 'slideUp 0.2s cubic-bezier(0.32,0.72,0,1) both',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
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
    paddingTop: '16px',
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
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border)',
  },
  deleteBody: {
    textAlign: 'center',
    padding: '8px 0 24px',
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
