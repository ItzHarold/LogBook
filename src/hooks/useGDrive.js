import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { generatePDFBase64, getPDFFilename } from '../lib/generatePDF'

const CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID
const REDIRECT_URI = window.location.origin + '/'
const SCOPES       = 'https://www.googleapis.com/auth/drive.file'

export function useGDrive(profile, refreshProfile) {
  const [uploading, setUploading]       = useState(false)
  const [uploadError, setUploadError]   = useState('')
  const [lastUploadUrl, setLastUploadUrl] = useState('')

  const isConnected = !!profile?.gdrive_refresh_token

  /** Redirects the user to Google OAuth to grant Drive access. */
  const connect = useCallback(() => {
    if (!CLIENT_ID) {
      console.error('[useGDrive] VITE_GOOGLE_CLIENT_ID is not set.')
      return
    }
    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      scope:         SCOPES,
      access_type:   'offline',
      prompt:        'consent',   // forces refresh_token to be returned
      state:         'gdrive',
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }, [])

  /** Clears the stored token, disconnecting Google Drive. */
  const disconnect = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/gdrive-disconnect', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
    })
    await refreshProfile()
  }, [refreshProfile])

  /** Generates the PDF for an entry and uploads it to the user's Google Drive. */
  const uploadPDF = useCallback(async (entry, profile) => {
    setUploading(true)
    setUploadError('')
    setLastUploadUrl('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const pdfBase64 = generatePDFBase64(entry, profile)
      const filename  = getPDFFilename(entry, profile)

      const res  = await fetch('/api/gdrive-upload', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ pdfBase64, filename }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed.')

      setLastUploadUrl(data.webViewLink ?? '')
      return true
    } catch (err) {
      setUploadError(err.message)
      return false
    } finally {
      setUploading(false)
    }
  }, [])

  return {
    isConnected,
    connect,
    disconnect,
    uploadPDF,
    uploading,
    uploadError,
    lastUploadUrl,
    clearUploadError: () => setUploadError(''),
    clearLastUrl:     () => setLastUploadUrl(''),
  }
}
