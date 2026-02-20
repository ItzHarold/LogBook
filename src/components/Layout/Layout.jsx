import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout({
  children, page, setPage, profile, signOut,
  logbooks, activeLogbook, setActiveLogbookId, addLogbook,
}) {
  const logbookProps = { logbooks, activeLogbook, setActiveLogbookId, addLogbook }

  return (
    <div className="app-root">
      <Sidebar
        page={page} setPage={setPage}
        profile={profile} signOut={signOut}
        {...logbookProps}
      />
      <main className="app-main">
        <div className="app-content">
          {children}
        </div>
      </main>
      <MobileNav
        page={page} setPage={setPage}
        profile={profile} signOut={signOut}
        {...logbookProps}
      />
    </div>
  )
}
