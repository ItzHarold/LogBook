import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'new-entry', label: 'New Entry',  icon: '+' },
  { id: 'history',   label: 'History',   icon: '≡' },
  { id: 'ai-chat',   label: 'AI Chat',   icon: '✦' },
]

export default function MobileNav({ page, setPage, profile, signOut }) {
  const [sheetOpen, setSheetOpen]         = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [deleteError, setDeleteError]     = useState('')

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

  const closeSheet = () => {
    setSheetOpen(false)
    setShowDeleteConfirm(false)
    setDeleteError('')
  }

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-btn ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {page === item.id && <span className="mobile-nav-pip" />}
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}

        {/* Account button */}
        <button
          className="mobile-nav-btn"
          onClick={() => setSheetOpen(true)}
          aria-label="Account menu"
        >
          <span className="mobile-nav-icon" style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(240,192,96,0.25)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'var(--font-heading)',
          }}>
            {profile.name.charAt(0).toUpperCase()}
          </span>
          <span className="mobile-nav-label">Account</span>
        </button>
      </nav>

      {/* Sheet overlay */}
      <div
        className={`sheet-overlay ${sheetOpen ? 'open' : ''}`}
        onClick={closeSheet}
      />

      {/* Bottom sheet */}
      {sheetOpen && (
        <div className="sheet">
          <div className="sheet-handle" />

          {/* User info */}
          <div className="sheet-user">
            <div className="sheet-avatar">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="sheet-name">{profile.name}</div>
              <div className="sheet-org">{profile.organization}</div>
            </div>
          </div>

          {/* Sign out */}
          <button className="sheet-btn" onClick={() => { closeSheet(); signOut() }}>
            <span className="sheet-btn-icon">↩</span>
            Sign out
          </button>

          {/* Privacy */}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="sheet-btn"
            onClick={closeSheet}
          >
            <span className="sheet-btn-icon">🔒</span>
            Privacy Policy
          </a>

          {/* Delete account */}
          {!showDeleteConfirm ? (
            <button className="sheet-btn danger" onClick={() => setShowDeleteConfirm(true)}>
              <span className="sheet-btn-icon">🗑</span>
              Delete account
            </button>
          ) : (
            <div className="delete-confirm-sheet">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                This permanently deletes all your entries, profile, and cancels any active subscription. This cannot be undone.
              </p>
              {deleteError && (
                <p style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '10px' }}>⚠ {deleteError}</p>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting
                    ? <div className="spinner" style={{ width: '14px', height: '14px', borderTopColor: 'var(--red)' }} />
                    : 'Yes, delete'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError('') }}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
