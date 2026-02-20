// ─── Vercel Serverless Function: POST /api/gdrive-callback ────
//
// Exchanges a Google OAuth authorization code for tokens and stores
// the refresh_token in Supabase so we can upload on the user's behalf.
//
// Required env vars:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const TOKEN_URL    = 'https://oauth2.googleapis.com/token'
const REDIRECT_URI = process.env.GDRIVE_REDIRECT_URI ?? 'https://www.booklogger.app/'

function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
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

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Missing code.' })

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }).toString(),
    })
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.refresh_token) {
      console.error('[gdrive-callback] Token exchange failed:', tokenData)
      return res.status(400).json({ error: tokenData.error_description ?? 'Google token exchange failed.' })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ gdrive_refresh_token: tokenData.refresh_token })
      .eq('id', user.id)

    if (updateError) {
      console.error('[gdrive-callback] Supabase update failed:', updateError.message)
      return res.status(500).json({ error: 'Failed to save Google Drive connection.' })
    }

    console.log(`[gdrive-callback] ✓ User ${user.id} connected Google Drive`)
    return res.status(200).json({ connected: true })
  } catch (err) {
    console.error('[gdrive-callback]', err)
    return res.status(500).json({ error: err.message })
  }
}
