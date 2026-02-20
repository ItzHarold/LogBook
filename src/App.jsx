import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { useEntries } from './hooks/useEntries'

import AuthPage from './components/Auth/AuthPage'
import Onboarding from './components/Onboarding/Onboarding'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import NewEntry from './pages/NewEntry'
import History from './pages/History'
import AIChat from './pages/AIChat'

// ─── Loading screen ───────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      gap: '20px',
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '26px',
        color: 'var(--accent)',
        letterSpacing: '-0.01em',
      }}>
        LogBook
      </span>
      <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--accent)' }} />
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, loading: profileLoading, saveProfile, refreshProfile } = useProfile(user?.id)
  const { entries, loading: entriesLoading, addEntry, deleteEntry } = useEntries(user?.id)

  const [page, setPage] = useState('dashboard')

  // ── Detect Stripe redirect back ────────────────────────────
  // Stripe sends users back to /?upgraded=true on success.
  // We navigate to AI Chat and refresh the profile so is_pro
  // updates immediately without requiring a manual page reload.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname)
      // Navigate to AI Chat and refresh profile
      setPage('ai-chat')
      refreshProfile()
    }
  }, [refreshProfile])

  // ── Guards ──
  if (authLoading || (user && profileLoading)) return <LoadingScreen />
  if (!user)    return <AuthPage />
  if (!profile) return <Onboarding onComplete={saveProfile} />

  const sharedProps = { profile, entries, entriesLoading, user }

  return (
    <Layout page={page} setPage={setPage} profile={profile} signOut={signOut}>
      {page === 'dashboard' && (
        <Dashboard {...sharedProps} setPage={setPage} />
      )}
      {page === 'new-entry' && (
        <NewEntry {...sharedProps} addEntry={addEntry} setPage={setPage} />
      )}
      {page === 'history' && (
        <History {...sharedProps} deleteEntry={deleteEntry} setPage={setPage} />
      )}
      {page === 'ai-chat' && (
        <AIChat {...sharedProps} refreshProfile={refreshProfile} />
      )}
    </Layout>
  )
}
