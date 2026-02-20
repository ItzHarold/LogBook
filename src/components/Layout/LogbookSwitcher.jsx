import { useState, useRef, useEffect } from 'react'

export default function LogbookSwitcher({
  logbooks,
  activeLogbook,
  setActiveLogbookId,
  addLogbook,
  compact = false, // true = mobile header style
}) {
  const [open, setOpen]         = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm]         = useState({ name: '', organization: '', default_location: '' })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const dropdownRef             = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setCreating(false)
        setError('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (id) => {
    setActiveLogbookId(id)
    setOpen(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Logbook name is required.'); return }
    setSaving(true)
    setError('')
    try {
      await addLogbook({
        name:             form.name.trim(),
        organization:     form.organization.trim(),
        default_location: form.default_location.trim(),
      })
      setForm({ name: '', organization: '', default_location: '' })
      setCreating(false)
      setOpen(false)
    } catch (err) {
      setError(err.message ?? 'Failed to create logbook.')
    } finally {
      setSaving(false)
    }
  }

  if (!activeLogbook) return null

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen((v) => !v); setCreating(false) }}
        style={{
          ...styles.trigger,
          ...(compact ? styles.triggerCompact : {}),
        }}
        title="Switch logbook"
      >
        <span style={styles.triggerIcon}>📓</span>
        <span style={styles.triggerName}>{activeLogbook.name}</span>
        <span style={{ ...styles.triggerChevron, transform: open ? 'rotate(180deg)' : 'none' }}>
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          ...styles.dropdown,
          ...(compact ? styles.dropdownCompact : {}),
        }}>
          {!creating ? (
            <>
              <p style={styles.dropdownLabel}>Your logbooks</p>

              {logbooks.map((lb) => (
                <button
                  key={lb.id}
                  style={{
                    ...styles.logbookItem,
                    ...(lb.id === activeLogbook.id ? styles.logbookItemActive : {}),
                  }}
                  onClick={() => handleSelect(lb.id)}
                >
                  <span style={styles.logbookItemIcon}>
                    {lb.id === activeLogbook.id ? '✓' : '○'}
                  </span>
                  <div style={styles.logbookItemInfo}>
                    <div style={styles.logbookItemName}>{lb.name}</div>
                    {lb.organization && (
                      <div style={styles.logbookItemOrg}>{lb.organization}</div>
                    )}
                  </div>
                </button>
              ))}

              <div style={styles.dropdownDivider} />

              <button
                style={styles.newBtn}
                onClick={() => setCreating(true)}
              >
                <span style={styles.newBtnIcon}>+</span>
                New logbook
              </button>
            </>
          ) : (
            <form onSubmit={handleCreate} style={styles.createForm}>
              <p style={styles.dropdownLabel}>New logbook</p>

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

              {error && <p style={styles.createError}>⚠ {error}</p>}

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '13px', height: '36px' }}
                  disabled={saving}
                >
                  {saving
                    ? <div className="spinner" style={{ width: '13px', height: '13px', borderTopColor: '#0f0f13' }} />
                    : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '13px', height: '36px' }}
                  onClick={() => { setCreating(false); setError('') }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 10px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'border-color var(--t-fast)',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-primary)',
  },
  triggerCompact: {
    background: 'transparent',
    border: 'none',
    padding: '4px 8px',
    width: 'auto',
    maxWidth: '220px',
  },
  triggerIcon: { fontSize: '14px', flexShrink: 0 },
  triggerName: {
    flex: 1,
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  triggerChevron: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    flexShrink: 0,
    transition: 'transform 0.15s ease',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    width: '100%',
    minWidth: '220px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '8px',
    zIndex: 200,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.15s ease both',
  },
  dropdownCompact: {
    left: 'auto',
    right: 0,
    top: 'calc(100% + 4px)',
    minWidth: '260px',
  },
  dropdownLabel: {
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '4px 8px 8px',
  },
  logbookItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '8px 10px',
    background: 'none',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'background var(--t-fast)',
    textAlign: 'left',
  },
  logbookItemActive: {
    background: 'var(--accent-dim)',
  },
  logbookItemIcon: {
    fontSize: '12px',
    color: 'var(--accent)',
    width: '16px',
    flexShrink: 0,
    textAlign: 'center',
  },
  logbookItemInfo: { flex: 1, overflow: 'hidden' },
  logbookItemName: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logbookItemOrg: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '1px',
  },
  dropdownDivider: {
    height: '1px',
    background: 'var(--border)',
    margin: '6px 0',
  },
  newBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '8px 10px',
    background: 'none',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    color: 'var(--accent)',
    transition: 'background var(--t-fast)',
  },
  newBtnIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '5px',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(240,192,96,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 300,
    color: 'var(--accent)',
    flexShrink: 0,
  },
  createForm: { padding: '4px 0' },
  createField: { marginBottom: '10px' },
  createLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '5px',
  },
  createInput: { fontSize: '13px', padding: '7px 10px', height: '34px' },
  createError: { fontSize: '12px', color: 'var(--red)', marginBottom: '6px' },
}
