import { createPortal } from 'react-dom'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ProfilePanel({ profile, signOut, onClose, mobile = false }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting]                   = useState(false)
  const [deleteError, setDeleteError]             = useState('')

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res  = await fetch('/api/delete-account', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Deletion failed.')
      await supabase.auth.signOut()
      window.location.reload()
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  const content = (
    <>
      {/* Overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Panel */}
      <div style={{
        ...styles.panel,
        ...(mobile ? styles.panelMobile : {}),
      }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.avatar}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.name}>{profile.name}</div>
            <div style={styles.org}>{profile.organization}</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Plan badge */}
        <div style={styles.planRow}>
          <span style={{
            ...styles.planBadge,
            ...(profile.is_pro ? styles.planBadgePro : styles.planBadgeFree),
          }}>
            {profile.is_pro ? '✦ Pro' : 'Free plan'}
          </span>
          {!profile.is_pro && (
            <span style={styles.upgradeHint}>Upgrade for AI Chat</span>
          )}
        </div>

        <div style={styles.divider} />

        {/* Actions */}
        <div style={styles.actions}>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.actionBtn}
            onClick={onClose}
          >
            <span style={styles.actionIcon}>🔒</span>
            <span>Privacy Policy</span>
          </a>

          <button style={styles.actionBtn} onClick={() => { onClose(); signOut() }}>
            <span style={styles.actionIcon}>↩</span>
            <span>Sign out</span>
          </button>
        </div>

        <div style={styles.divider} />

        {/* Delete account */}
        {!showDeleteConfirm ? (
          <button
            style={{ ...styles.actionBtn, ...styles.dangerBtn }}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <span style={{ ...styles.actionIcon, ...styles.dangerIcon }}>🗑</span>
            <span>Delete account</span>
          </button>
        ) : (
          <div style={styles.deleteConfirm}>
            <p style={styles.deleteWarning}>
              This permanently deletes all your logbooks, entries, and cancels any active subscription. This cannot be undone.
            </p>
            {deleteError && (
              <p style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '10px' }}>⚠ {deleteError}</p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1, fontSize: '13px' }}
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting
                  ? <div className="spinner" style={{ width: '13px', height: '13px', borderTopColor: 'var(--red)' }} />
                  : 'Yes, delete everything'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '13px' }}
                onClick={() => { setShowDeleteConfirm(false); setDeleteError('') }}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return createPortal(content, document.body)
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    animation: 'fadeIn 0.15s ease both',
  },
  panel: {
    position: 'fixed',
    bottom: '80px',
    left: '12px',
    width: '280px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    zIndex: 1001,
    animation: 'slideUp 0.2s ease both',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
  },
  panelMobile: {
    left: '50%',
    right: 'auto',
    transform: 'translateX(-50%)',
    bottom: 'calc(var(--mobile-nav-h) + 8px)',
    width: 'calc(100vw - 32px)',
    maxWidth: '360px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(240,192,96,0.25)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
    flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  name: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  org: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '2px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    flexShrink: 0,
    lineHeight: 1,
    fontFamily: 'var(--font-body)',
  },
  planRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
  },
  planBadge: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    borderRadius: '99px',
    padding: '3px 10px',
    border: '1px solid',
  },
  planBadgePro: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    borderColor: 'rgba(240,192,96,0.3)',
  },
  planBadgeFree: {
    background: 'var(--bg-card)',
    color: 'var(--text-muted)',
    borderColor: 'var(--border)',
  },
  upgradeHint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    margin: '12px 0',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 8px',
    background: 'none',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    textDecoration: 'none',
    width: '100%',
    transition: 'background var(--t-fast)',
  },
  dangerBtn: { color: 'var(--red)' },
  actionIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    flexShrink: 0,
  },
  dangerIcon: {
    background: 'var(--red-dim)',
    borderColor: 'rgba(248,113,113,0.2)',
  },
  deleteConfirm: {
    background: 'var(--bg-card)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
  },
  deleteWarning: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '12px',
  },
}
