import { useState } from 'react'
import ProfilePanel from './ProfilePanel'
import LogbookModal from '../Logbooks/LogbookModal'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'new-entry', label: 'New Entry',  icon: '+' },
  { id: 'history',   label: 'History',   icon: '≡' },
  { id: 'ai-chat',   label: 'AI Chat',   icon: '✦' },
]

export default function MobileNav({
  page, setPage, profile, signOut,
  logbooks, activeLogbook, setActiveLogbookId, addLogbook, deleteLogbook,
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [modal, setModal]             = useState(null)
  const [lbMenuOpen, setLbMenuOpen]   = useState(false)

  return (
    <>
      {/* Mobile top header */}
      <header className="mobile-header">
        <span className="mobile-header-logo">📓 LogBook</span>

        {/* Logbook picker */}
        <div style={{ position: 'relative' }}>
          <button
            className="mobile-header-lb-btn"
            onClick={() => setLbMenuOpen((v) => !v)}
          >
            <span style={{ fontSize: '12px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeLogbook?.name}
            </span>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>▾</span>
          </button>

          {lbMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 150 }}
                onClick={() => setLbMenuOpen(false)}
              />
              <div style={styles.lbMenu}>
                <p style={styles.lbMenuLabel}>Your logbooks</p>
                {logbooks.map((lb) => (
                  <button
                    key={lb.id}
                    style={{
                      ...styles.lbMenuItem,
                      ...(lb.id === activeLogbook?.id ? styles.lbMenuItemActive : {}),
                    }}
                    onClick={() => { setActiveLogbookId(lb.id); setLbMenuOpen(false) }}
                  >
                    <span style={{ color: 'var(--accent)', width: '14px', flexShrink: 0 }}>
                      {lb.id === activeLogbook?.id ? '✓' : ''}
                    </span>
                    {lb.name}
                  </button>
                ))}
                <div style={styles.lbMenuDivider} />
                <button
                  style={styles.lbMenuNew}
                  onClick={() => { setLbMenuOpen(false); setModal({ mode: 'create' }) }}
                >
                  + New logbook
                </button>
              </div>
            </>
          )}
        </div>
      </header>

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

        <button
          className="mobile-nav-btn"
          onClick={() => setProfileOpen(true)}
          aria-label="Account"
        >
          <span className="mobile-nav-icon" style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--accent-dim)', border: '1px solid rgba(240,192,96,0.25)',
            color: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '11px', fontWeight: 600,
            fontFamily: 'var(--font-heading)',
          }}>
            {profile.name.charAt(0).toUpperCase()}
          </span>
          <span className="mobile-nav-label">Account</span>
        </button>
      </nav>

      {/* Modals */}
      {modal && (
        <LogbookModal
          mode={modal.mode}
          target={modal.target}
          addLogbook={addLogbook}
          deleteLogbook={deleteLogbook}
          onClose={() => setModal(null)}
        />
      )}

      {profileOpen && (
        <ProfilePanel
          profile={profile}
          signOut={signOut}
          onClose={() => setProfileOpen(false)}
          mobile
        />
      )}
    </>
  )
}

const styles = {
  lbMenu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: '200px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '8px',
    zIndex: 200,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.15s ease both',
  },
  lbMenuLabel: {
    fontSize: '10px', fontWeight: 600,
    letterSpacing: '0.07em', textTransform: 'uppercase',
    color: 'var(--text-muted)', padding: '2px 8px 8px',
  },
  lbMenuItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '8px', background: 'none',
    border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'left',
  },
  lbMenuItemActive: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  lbMenuDivider: { height: '1px', background: 'var(--border)', margin: '6px 0' },
  lbMenuNew: {
    display: 'flex', alignItems: 'center',
    width: '100%', padding: '8px', background: 'none',
    border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
    fontSize: '13px', color: 'var(--accent)',
  },
}
