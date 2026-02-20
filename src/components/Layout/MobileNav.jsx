import { useState } from 'react'
import ProfilePanel from './ProfilePanel'
import LogbookSwitcher from './LogbookSwitcher'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'new-entry', label: 'New Entry',  icon: '+' },
  { id: 'history',   label: 'History',   icon: '≡' },
  { id: 'ai-chat',   label: 'AI Chat',   icon: '✦' },
]

export default function MobileNav({
  page, setPage, profile, signOut,
  logbooks, activeLogbook, setActiveLogbookId, addLogbook,
}) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      {/* Mobile top header */}
      <header className="mobile-header">
        <span className="mobile-header-logo">📓 LogBook</span>
        <LogbookSwitcher
          logbooks={logbooks}
          activeLogbook={activeLogbook}
          setActiveLogbookId={setActiveLogbookId}
          addLogbook={addLogbook}
          compact
        />
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

        {/* Account button */}
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

      {/* Profile panel */}
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
