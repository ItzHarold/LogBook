import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { useLogbooks } from './hooks/useLogbooks'
import { useEntries } from './hooks/useEntries'
import { useGDrive } from './hooks/useGDrive'

import AuthPage from './components/Auth/AuthPage'
import Onboarding from './components/Onboarding/Onboarding'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import NewEntry from './pages/NewEntry'
import History from './pages/History'
import AIChat from './pages/AIChat'

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

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, loading: profileLoading, saveProfile, refreshProfile } = useProfile(user?.id)
  const {
    logbooks, activeLogbook,
    setActiveLogbookId, addLogbook,
    loading: logbooksLoading,
  } = useLogbooks(user?.id)

  // Entries scoped to the active logbook
  const { entries, loading: entriesLoading, addEntry, deleteEntry } = useEntries(
    user?.id,
    activeLogbook?.id,
  )

  const gDrive = useGDrive(profile, refreshProfile)
  const [page, setPage] = useState('dashboard')

  // Merge activeLogbook fields into profile so all pages keep working
  const mergedProfile = (profile && activeLogbook)
    ? {
        ...profile,
        logbook_name:     activeLogbook.name,
        organization:     activeLogbook.organization,
        default_location: activeLogbook.default_location,
        logbook_id:       activeLogbook.id,
      }
    : profile

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // ── Stripe redirect ──
    if (params.get('upgraded') === 'true') {
      window.history.replaceState({}, '', window.location.pathname)
      setPage('ai-chat')
      refreshProfile()
      return
    }

    // ── Google Drive OAuth redirect ──
    const code  = params.get('code')
    const state = params.get('state')
    if (code && state === 'gdrive') {
      window.history.replaceState({}, '', window.location.pathname)
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) return
        try {
          const res = await fetch('/api/gdrive-callback', {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ code }),
          })
          if (res.ok) await refreshProfile()
          else {
            const err = await res.json()
            console.error('[GDrive callback]', err.error)
          }
        } catch (err) {
          console.error('[GDrive callback]', err)
        }
      })
    }
  }, [refreshProfile])

  // ── Onboarding completion ──
  // Saves the user profile + creates the first logbook in one go
  const handleOnboardingComplete = async (data) => {
    await saveProfile(data)
    await addLogbook({
      name:             data.logbook_name,
      organization:     data.organization,
      default_location: data.default_location,
    })
  }

  const isLoading = authLoading || (user && (profileLoading || logbooksLoading))
  if (isLoading) return <LoadingScreen />
  if (!user)     return <AuthPage />
  if (!profile)  return <Onboarding onComplete={handleOnboardingComplete} />

  // If profile exists but no logbooks yet (edge case after migration)
  // wait for logbooks to finish loading before rendering the app
  if (profile && !activeLogbook && !logbooksLoading) {
    // Auto-create a logbook from the profile data (handles pre-migration users)
    addLogbook({
      name:             profile.logbook_name ?? 'My Logbook',
      organization:     profile.organization  ?? '',
      default_location: profile.default_location ?? '',
    })
    return <LoadingScreen />
  }

  const sharedProps = {
    profile:        mergedProfile,
    entries,
    entriesLoading,
    user,
  }

  const logbookProps = { logbooks, activeLogbook, setActiveLogbookId, addLogbook }

  return (
    <Layout
      page={page} setPage={setPage}
      profile={mergedProfile} signOut={signOut}
      {...logbookProps}
    >
      {page === 'dashboard' && (
        <Dashboard {...sharedProps} setPage={setPage} />
      )}
      {page === 'new-entry' && (
        <NewEntry {...sharedProps} addEntry={addEntry} setPage={setPage} gDrive={gDrive} />
      )}
      {page === 'history' && (
        <History {...sharedProps} deleteEntry={deleteEntry} setPage={setPage} gDrive={gDrive} />
      )}
      {page === 'ai-chat' && (
        <AIChat {...sharedProps} refreshProfile={refreshProfile} />
      )}
    </Layout>
  )
}
