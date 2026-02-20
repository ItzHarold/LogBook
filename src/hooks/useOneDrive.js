import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { generatePDFBase64, getPDFFilename } from '../lib/generatePDF'

const CLIENT_ID    = import.meta.env.VITE_MICROSOFT_CLIENT_ID
const REDIRECT_URI = window.location.origin + '/'
const SCOPES       = 'Files.ReadWrite offline_access'

/**
 * Manages the OneDrive connection for the current user.
 *
 * @param {object} profile - The current user profile (must include onedrive_refresh_token)
 * @param {function} refreshProfile - Callback to re-fetch profile after connecting
 */
export function useOneDrive(profile, refreshProfile) {
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [lastUploadUrl, setLastUploadUrl] = useState('')

  const isConnected = !!profile?.onedrive_refresh_token

  /** Redirects the user to Microsoft OAuth to grant OneDrive access. */
  const connect = useCallback(() => {
    if (!CLIENT_ID) {
      console.error('[useOneDrive] VITE_MICROSOFT_CLIENT_ID is not set.')
      return
    }

    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      response_type: 'code',
      redirect_uri:  REDIRECT_URI,
      scope:         SCOPES,
      response_mode: 'query',
      state:         'onedrive',
      prompt:        'select_account',
    })

    window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
  }, [])

  /** Removes the stored refresh token, disconnecting OneDrive. */
  const disconnect = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/onedrive-disconnect', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
    })
    await refreshProfile()
  }, [refreshProfile])

  /**
   * Generates the PDF for an entry and uploads it to OneDrive.
   * Returns true on success.
   */
  const uploadPDF = useCallback(async (entry, profile) => {
    setUploading(true)
    setUploadError('')
    setLastUploadUrl('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const pdfBase64 = generatePDFBase64(entry, profile)
      const filename  = getPDFFilename(entry, profile)

      const res  = await fetch('/api/onedrive-upload', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ pdfBase64, filename }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Upload failed.')

      setLastUploadUrl(data.webUrl ?? '')
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
