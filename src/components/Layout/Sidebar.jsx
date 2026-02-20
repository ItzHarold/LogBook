import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Sidebar({ page, setPage, profile, signOut }) {
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
      // Account deleted — sign out and reload
      await supabase.auth.signOut()
      window.location.reload()
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'new-entry', label: 'New Entry',  icon: '+' },
    { id: 'history',   label: 'History',   icon: '≡' },
    { id: 'ai-chat',   label: 'AI Chat',   icon: '✦' },
  ]

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <span style={styles.logoIcon}>📓</span>
        <div>
          <div style={styles.logoName}>LogBook</div>
          <div style={styles.logoSub} title={profile.logbook_name}>
            {profile.logbook_name}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <span style={{
                ...styles.navIcon,
                ...(item.id === 'new-entry' ? styles.newEntryIcon : {}),
              }}>
                {item.icon}
              </span>
              <span style={styles.navLabel}>{item.label}</span>
              {isActive && <div style={styles.activePip} />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.userChip}>
          <div style={styles.avatar}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{profile.name}</div>
            <div style={styles.userOrg} title={profile.organization}>
              {profile.organization}
            </div>
          </div>
        </div>

        <button
          className="btn btn-ghost"
          onClick={signOut}
          style={{ width: '100%', justifyContent: 'flex-start', fontSize: '13px' }}
        >
          <span>↩</span> Sign out
        </button>

        {/* Privacy policy link */}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.privacyLink}
        >
          Privacy Policy
        </a>

        {/* Delete account */}
        {!showDeleteConfirm ? (
          <button
            className="btn btn-ghost"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ width: '100%', justifyContent: 'flex-start', fontSize: '12px', color: 'var(--text-muted)', opacity: 0.7 }}
          >
            Delete account
          </button>
        ) : (
          <div style={styles.deleteConfirm}>
            <p style={styles.deleteWarning}>
              This permanently deletes all your entries, profile, and cancels any active subscription. This cannot be undone.
            </p>
            {deleteError && (
              <p style={{ fontSize: '11px', color: 'var(--red)', marginBottom: '8px' }}>⚠ {deleteError}</p>
            )}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1, fontSize: '12px', padding: '6px 0' }}
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting
                  ? <div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: 'var(--red)' }} />
                  : 'Yes, delete'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: '12px', padding: '6px 0' }}
                onClick={() => { setShowDeleteConfirm(false); setDeleteError('') }}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    height: '100vh',
    background: 'var(--bg-elevated)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 12px',
    position: 'sticky',
    top: 0,
    flexShrink: 0,
    overflowY: 'auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px 20px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '12px',
  },
  logoIcon: { fontSize: '22px', flexShrink: 0 },
  logoName: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    color: 'var(--accent)',
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
  },
  logoSub: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '140px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    fontWeight: 400,
    transition: 'all var(--t-fast)',
    position: 'relative',
  },
  navItemActive: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    fontWeight: 500,
  },
  navIcon: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
  },
  newEntryIcon: {
    background: 'var(--accent-dim)',
    borderRadius: '6px',
    fontSize: '18px',
    fontWeight: 300,
    border: '1px solid rgba(240, 192, 96, 0.2)',
  },
  navLabel: { flex: 1 },
  activePip: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'var(--accent)',
    flexShrink: 0,
  },
  footer: {
    borderTop: '1px solid var(--border)',
    paddingTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(240, 192, 96, 0.25)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    flexShrink: 0,
    fontFamily: 'var(--font-heading)',
  },
  userInfo: { overflow: 'hidden' },
  userName: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userOrg: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  privacyLink: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    padding: '4px 12px',
    opacity: 0.7,
    transition: 'opacity 0.15s',
  },
  deleteConfirm: {
    background: 'var(--bg)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px',
    marginTop: '4px',
  },
  deleteWarning: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '10px',
  },
}
