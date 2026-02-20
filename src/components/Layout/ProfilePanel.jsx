import { createPortal } from 'react-dom'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ProfilePanel({ profile, signOut, onClose }) {
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
      <div style={styles.backdrop} onClick={onClose} />

      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.avatar}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.name}>{profile.name}</div>
            <div style={styles.org}>{profile.organization}</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Plan */}
        <div style={styles.planRow}>
          <span style={{
            ...styles.planBadge,
            ...(profile.is_pro ? styles.planBadgePro : styles.planBadgeFree),
          }}>
            {profile.is_pro ? '✦ Pro' : 'Free plan'}
          </span>
          {!profile.is_pro && <span style={styles.upgradeHint}>Upgrade for AI Chat</span>}
        </div>

        <div style={styles.divider} />

        {/* Actions */}
        <div style={styles.actions}>
          <a
            href="/privacy"
            style={styles.actionBtn}
            onClick={onClose}
          >
            <span style={styles.actionIcon}>🔒</span>
            Privacy Policy
          </a>

          <button style={styles.actionBtn} onClick={() => { onClose(); signOut() }}>
            <span style={styles.actionIcon}>↩</span>
            Sign out
          </button>
        </div>

        <div style={styles.divider} />

        {/* Delete account */}
        {!showDeleteConfirm ? (
          <button
            style={{ ...styles.actionBtn, color: 'var(--red)' }}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <span style={{ ...styles.actionIcon, background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)' }}>🗑</span>
            Delete account
          </button>
        ) : (
          <div style={styles.deleteConfirm}>
            <p style={styles.deleteWarning}>
              Permanently deletes all your logbooks, entries, and cancels any active subscription. Cannot be undone.
            </p>
            {deleteError && (
              <p style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '10px' }}>⚠ {deleteError}</p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1, fontSize: '12px' }}
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting
                  ? <div className="spinner" style={{ width: '13px', height: '13px', borderTopColor: 'var(--red)' }} />
                  : 'Yes, delete everything'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '12px' }}
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
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 1000,
    animation: 'fadeIn 0.15s ease both',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(360px, calc(100vw - 32px))',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
    zIndex: 1001,
    animation: 'slideUp 0.2s cubic-bezier(0.32,0.72,0,1) both',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(240,192,96,0.25)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '17px',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
    flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  name: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  org: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '15px',
    padding: '4px 6px',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    flexShrink: 0,
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
    gap: '12px',
    padding: '10px 8px',
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
    textAlign: 'left',
  },
  actionIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '7px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
  },
  deleteConfirm: {
    background: 'var(--bg-card)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '14px',
    marginTop: '4px',
  },
  deleteWarning: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '12px',
  },
}
