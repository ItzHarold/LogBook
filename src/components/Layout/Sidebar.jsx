const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'new-entry', label: 'New Entry',  icon: '+' },
  { id: 'history',   label: 'History',   icon: '≡' },
  { id: 'ai-chat',   label: 'AI Chat',   icon: '✦' },
]

export default function Sidebar({ page, setPage, profile, signOut }) {
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
}
