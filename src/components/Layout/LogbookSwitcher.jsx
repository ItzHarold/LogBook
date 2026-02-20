import { useState, useRef, useEffect } from 'react'
import FieldBuilder from '../Logbooks/FieldBuilder'

export default function LogbookSwitcher({
  logbooks, activeLogbook,
  setActiveLogbookId, addLogbook, deleteLogbook,
  compact = false,
}) {
  const [open, setOpen]               = useState(false)
  const [view, setView]               = useState('list')   // 'list' | 'create' | 'delete'
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm]               = useState({ name: '', organization: '', default_location: '' })
  const [fields, setFields]           = useState([])
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [error, setError]             = useState('')
  const dropdownRef                   = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeAll()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const closeAll = () => {
    setOpen(false)
    setView('list')
    setDeleteTarget(null)
    setError('')
  }

  const handleSelect = (id) => {
    setActiveLogbookId(id)
    closeAll()
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Logbook name is required.'); return }
    // Validate fields: each must have a label
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
      setForm({ name: '', organization: '', default_location: '' })
      setFields([])
      closeAll()
    } catch (err) {
      setError(err.message ?? 'Failed to create logbook.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    try {
      await deleteLogbook(deleteTarget.id)
      closeAll()
    } catch (err) {
      setError(err.message ?? 'Failed to delete logbook.')
      setDeleting(false)
    }
  }

  if (!activeLogbook) return null

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen((v) => !v); setView('list') }}
        style={{ ...styles.trigger, ...(compact ? styles.triggerCompact : {}) }}
      >
        <span style={styles.triggerIcon}>📓</span>
        <span style={styles.triggerName}>{activeLogbook.name}</span>
        <span style={{ ...styles.chevron, transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ ...styles.dropdown, ...(compact ? styles.dropdownRight : {}) }}>

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <>
              <p style={styles.sectionLabel}>Your logbooks</p>
              {logbooks.map((lb) => (
                <div key={lb.id} style={styles.lbRow}>
                  <button
                    style={{
                      ...styles.lbBtn,
                      ...(lb.id === activeLogbook.id ? styles.lbBtnActive : {}),
                    }}
                    onClick={() => handleSelect(lb.id)}
                  >
                    <span style={styles.lbCheck}>
                      {lb.id === activeLogbook.id ? '✓' : '○'}
                    </span>
                    <div style={styles.lbInfo}>
                      <div style={styles.lbName}>{lb.name}</div>
                      {lb.organization && <div style={styles.lbOrg}>{lb.organization}</div>}
                    </div>
                  </button>
                  {logbooks.length > 1 && (
                    <button
                      style={styles.deleteIconBtn}
                      onClick={() => { setDeleteTarget(lb); setView('delete') }}
                      title="Delete this logbook"
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}

              <div style={styles.divider} />
              <button style={styles.newBtn} onClick={() => { setView('create'); setError('') }}>
                <span style={styles.newBtnIcon}>+</span>
                New logbook
              </button>
            </>
          )}

          {/* ── CREATE VIEW ── */}
          {view === 'create' && (
            <form onSubmit={handleCreate} style={styles.createForm}>
              <div style={styles.createHeader}>
                <button type="button" style={styles.backBtn} onClick={() => { setView('list'); setError('') }}>← Back</button>
                <p style={styles.sectionLabel}>New logbook</p>
              </div>

              <div style={styles.createField}>
                <label style={styles.createLabel}>Name *</label>
                <input
                  className="input"
                  style={styles.createInput}
                  placeholder="e.g. Internship Log"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div style={styles.createField}>
                <label style={styles.createLabel}>Organisation</label>
                <input
                  className="input"
                  style={styles.createInput}
                  placeholder="e.g. Acme Corp"
                  value={form.organization}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                />
              </div>
              <div style={styles.createField}>
                <label style={styles.createLabel}>Default location</label>
                <input
                  className="input"
                  style={styles.createInput}
                  placeholder="e.g. Office, Remote"
                  value={form.default_location}
                  onChange={(e) => setForm((f) => ({ ...f, default_location: e.target.value }))}
                />
              </div>

              <FieldBuilder fields={fields} onChange={setFields} />

              {error && <p style={styles.errorText}>⚠ {error}</p>}

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '13px', height: '36px' }}
                  disabled={saving}
                >
                  {saving
                    ? <div className="spinner" style={{ width: '13px', height: '13px', borderTopColor: '#0f0f13' }} />
                    : 'Create logbook'}
                </button>
              </div>
            </form>
          )}

          {/* ── DELETE CONFIRM VIEW ── */}
          {view === 'delete' && deleteTarget && (
            <div style={styles.deleteView}>
              <button type="button" style={styles.backBtn} onClick={() => { setView('list'); setError('') }}>← Back</button>
              <p style={styles.deleteTitle}>Delete "{deleteTarget.name}"?</p>
              <p style={styles.deleteWarning}>
                This permanently deletes the logbook and all its entries. This cannot be undone.
              </p>
              {error && <p style={styles.errorText}>⚠ {error}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, fontSize: '13px' }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting
                    ? <div className="spinner" style={{ width: '13px', height: '13px', borderTopColor: 'var(--red)' }} />
                    : 'Yes, delete'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '13px' }}
                  onClick={() => { setView('list'); setError('') }}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

const styles = {
  trigger: {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '8px 10px',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    fontFamily: 'var(--font-body)', color: 'var(--text-primary)',
    transition: 'border-color var(--t-fast)',
  },
  triggerCompact: {
    background: 'transparent', border: 'none',
    padding: '4px 8px', width: 'auto', maxWidth: '220px',
  },
  triggerIcon: { fontSize: '14px', flexShrink: 0 },
  triggerName: {
    flex: 1, fontSize: '13px', fontWeight: 500,
    textAlign: 'left', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  chevron: {
    fontSize: '11px', color: 'var(--text-muted)',
    flexShrink: 0, transition: 'transform 0.15s ease',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0,
    width: '100%', minWidth: '260px', maxWidth: '360px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '10px',
    zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.15s ease both',
    maxHeight: '80vh', overflowY: 'auto',
  },
  dropdownRight: { left: 'auto', right: 0 },
  sectionLabel: {
    fontSize: '10px', fontWeight: 600,
    letterSpacing: '0.07em', textTransform: 'uppercase',
    color: 'var(--text-muted)', padding: '0 6px 8px',
  },
  lbRow: { display: 'flex', alignItems: 'center', gap: '2px' },
  lbBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    flex: 1, padding: '8px', background: 'none',
    border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
  },
  lbBtnActive: { background: 'var(--accent-dim)' },
  lbCheck: { fontSize: '12px', color: 'var(--accent)', width: '14px', flexShrink: 0, textAlign: 'center' },
  lbInfo: { flex: 1, overflow: 'hidden' },
  lbName: {
    fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  lbOrg: {
    fontSize: '11px', color: 'var(--text-muted)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  deleteIconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '6px', borderRadius: 'var(--radius-sm)',
    fontSize: '13px', flexShrink: 0, opacity: 0.5,
    transition: 'opacity var(--t-fast)',
  },
  divider: { height: '1px', background: 'var(--border)', margin: '6px 0' },
  newBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '8px', background: 'none',
    border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    fontSize: '13px', color: 'var(--accent)',
  },
  newBtnIcon: {
    width: '18px', height: '18px', borderRadius: '4px',
    background: 'var(--accent-dim)', border: '1px solid rgba(240,192,96,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', color: 'var(--accent)',
  },
  createForm: { padding: '2px 0' },
  createHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', color: 'var(--text-muted)',
    fontFamily: 'var(--font-body)', padding: '2px 0',
  },
  createField: { marginBottom: '8px' },
  createLabel: {
    display: 'block', fontSize: '10px', fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: '4px',
  },
  createInput: { fontSize: '13px', padding: '7px 10px', height: '34px' },
  errorText: { fontSize: '12px', color: 'var(--red)', marginTop: '8px' },
  deleteView: { padding: '2px 0' },
  deleteTitle: {
    fontFamily: 'var(--font-heading)', fontSize: '16px',
    color: 'var(--text-primary)', margin: '10px 0 8px',
  },
  deleteWarning: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 },
}
