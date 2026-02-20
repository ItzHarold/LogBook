import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function Layout({ children, page, setPage, profile, signOut }) {
  return (
    <div className="app-root">
      {/* Desktop sidebar */}
      <Sidebar
        page={page}
        setPage={setPage}
        profile={profile}
        signOut={signOut}
      />

      {/* Main content */}
      <main className="app-main">
        <div className="app-content">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav
        page={page}
        setPage={setPage}
        profile={profile}
        signOut={signOut}
      />
    </div>
  )
}
