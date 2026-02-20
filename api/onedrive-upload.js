// ─── Vercel Serverless Function: POST /api/onedrive-upload ────
//
// Accepts a base64 PDF, refreshes the user's OneDrive token,
// and uploads the file to a "LogBook" folder in their OneDrive.
//
// Required env vars:
//   MICROSOFT_CLIENT_ID
//   MICROSOFT_CLIENT_SECRET
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const TOKEN_URL    = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const GRAPH_URL    = 'https://graph.microsoft.com/v1.0'
const REDIRECT_URI = process.env.ONEDRIVE_REDIRECT_URI ?? 'https://www.booklogger.app/'

function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id:     process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    refresh_token: refreshToken,
    redirect_uri:  REDIRECT_URI,
    grant_type:    'refresh_token',
    scope:         'Files.ReadWrite offline_access',
  })

  const res  = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  })
  const data = await res.json()

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? 'Failed to refresh OneDrive token.')
  }

  return { accessToken: data.access_token, newRefreshToken: data.refresh_token }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // Verify user identity
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated.' })

  const supabase = getAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7))
  if (authError || !user) return res.status(401).json({ error: 'Invalid token.' })

  const { pdfBase64, filename } = req.body
  if (!pdfBase64 || !filename) return res.status(400).json({ error: 'Missing pdfBase64 or filename.' })

  // Get stored refresh token
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onedrive_refresh_token')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.onedrive_refresh_token) {
    return res.status(403).json({ error: 'OneDrive is not connected. Please connect your account first.', code: 'NOT_CONNECTED' })
  }

  try {
    // Refresh the access token
    const { accessToken, newRefreshToken } = await refreshAccessToken(profile.onedrive_refresh_token)

    // Store the new refresh token (tokens rotate on each use)
    if (newRefreshToken && newRefreshToken !== profile.onedrive_refresh_token) {
      await supabase
        .from('profiles')
        .update({ onedrive_refresh_token: newRefreshToken })
        .eq('id', user.id)
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    // Upload to OneDrive: /me/drive/root:/LogBook/{filename}:/content
    // This automatically creates the LogBook folder if it doesn't exist
    const uploadRes = await fetch(
      `${GRAPH_URL}/me/drive/root:/LogBook/${encodeURIComponent(filename)}:/content`,
      {
        method:  'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':  'application/pdf',
        },
        body: pdfBuffer,
      }
    )

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.json()
      console.error('[onedrive-upload] Graph API error:', uploadErr)
      return res.status(uploadRes.status).json({ error: uploadErr?.error?.message ?? 'Upload to OneDrive failed.' })
    }

    const uploaded = await uploadRes.json()
    console.log(`[onedrive-upload] ✓ Uploaded ${filename} for user ${user.id}`)

    return res.status(200).json({
      success:  true,
      filename,
      webUrl:   uploaded.webUrl,
    })
  } catch (err) {
    console.error('[onedrive-upload]', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error.' })
  }
}
