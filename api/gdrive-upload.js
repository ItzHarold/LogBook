// ─── Vercel Serverless Function: POST /api/gdrive-upload ──────
//
// Refreshes the user's Google access token, finds or creates a
// "LogBook" folder in their Drive, then uploads the PDF there.
//
// Required env vars:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const TOKEN_URL    = 'https://oauth2.googleapis.com/token'
const DRIVE_URL    = 'https://www.googleapis.com/drive/v3'
const UPLOAD_URL   = 'https://www.googleapis.com/upload/drive/v3/files'
const REDIRECT_URI = process.env.GDRIVE_REDIRECT_URI ?? 'https://www.booklogger.app/'
const FOLDER_NAME  = 'LogBook'

function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function refreshAccessToken(refreshToken) {
  const res  = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'refresh_token',
    }).toString(),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? 'Failed to refresh Google token.')
  }
  return data.access_token
}

/** Find the LogBook folder ID, or create it if it doesn't exist. */
async function getOrCreateFolder(accessToken) {
  // Search for existing folder
  const searchRes = await fetch(
    `${DRIVE_URL}/files?q=${encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const searchData = await searchRes.json()

  if (searchData.files?.length > 0) {
    return searchData.files[0].id
  }

  // Create the folder
  const createRes = await fetch(`${DRIVE_URL}/files`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name:     FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })
  const created = await createRes.json()
  if (!createRes.ok) throw new Error(created?.error?.message ?? 'Failed to create LogBook folder.')
  return created.id
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

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
    .select('gdrive_refresh_token')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.gdrive_refresh_token) {
    return res.status(403).json({
      error: 'Google Drive is not connected.',
      code:  'NOT_CONNECTED',
    })
  }

  try {
    const accessToken = await refreshAccessToken(profile.gdrive_refresh_token)
    const folderId    = await getOrCreateFolder(accessToken)
    const pdfBuffer   = Buffer.from(pdfBase64, 'base64')

    // Multipart upload: metadata + file content
    const boundary = 'logbook_boundary'
    const metadata = JSON.stringify({ name: filename, parents: [folderId] })
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: application/pdf',
      '',
      '',
    ].join('\r\n')

    const bodyBuffer = Buffer.concat([
      Buffer.from(body, 'utf8'),
      pdfBuffer,
      Buffer.from(`\r\n--${boundary}--`, 'utf8'),
    ])

    const uploadRes = await fetch(
      `${UPLOAD_URL}?uploadType=multipart&fields=id,name,webViewLink`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length,
        },
        body: bodyBuffer,
      }
    )

    const uploaded = await uploadRes.json()
    if (!uploadRes.ok) {
      console.error('[gdrive-upload] Upload error:', uploaded)
      return res.status(uploadRes.status).json({ error: uploaded?.error?.message ?? 'Google Drive upload failed.' })
    }

    console.log(`[gdrive-upload] ✓ Uploaded ${filename} for user ${user.id}`)
    return res.status(200).json({
      success:     true,
      filename,
      webViewLink: uploaded.webViewLink,
    })
  } catch (err) {
    console.error('[gdrive-upload]', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error.' })
  }
}
