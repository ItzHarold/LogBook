import Sidebar from './Sidebar'

export default function Layout({ children, page, setPage, profile, signOut }) {
  return (
    <div style={styles.root}>
      <Sidebar
        page={page}
        setPage={setPage}
        profile={profile}
        signOut={signOut}
      />
      <main style={styles.main}>
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  content: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '40px 36px',
  },
}
