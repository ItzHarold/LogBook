// ─── Vercel Serverless Function: POST /api/onedrive-callback ──
//
// Exchanges a Microsoft OAuth authorization code for tokens,
// stores the refresh_token in Supabase so we can upload on behalf
// of the user later without them needing to re-authenticate.
//
// Required env vars:
//   MICROSOFT_CLIENT_ID      — Azure App Registration client ID
//   MICROSOFT_CLIENT_SECRET  — Azure App Registration client secret
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const TOKEN_URL   = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const REDIRECT_URI = process.env.ONEDRIVE_REDIRECT_URI ?? 'https://www.booklogger.app/'

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

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Missing code.' })

  // Verify user identity
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated.' })

  const supabase = getAdminClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7))
  if (authError || !user) return res.status(401).json({ error: 'Invalid token.' })

  // Exchange code for tokens
  const params = new URLSearchParams({
    client_id:     process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri:  REDIRECT_URI,
    grant_type:    'authorization_code',
    scope:         'Files.ReadWrite offline_access',
  })

  try {
    const tokenRes  = await fetch(TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    })
    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.refresh_token) {
      console.error('[onedrive-callback] Token exchange failed:', tokenData)
      return res.status(400).json({ error: tokenData.error_description ?? 'Token exchange failed.' })
    }

    // Store refresh token in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onedrive_refresh_token: tokenData.refresh_token })
      .eq('id', user.id)

    if (updateError) {
      console.error('[onedrive-callback] Supabase update failed:', updateError.message)
      return res.status(500).json({ error: 'Failed to save OneDrive connection.' })
    }

    console.log(`[onedrive-callback] ✓ User ${user.id} connected OneDrive`)
    return res.status(200).json({ connected: true })
  } catch (err) {
    console.error('[onedrive-callback]', err)
    return res.status(500).json({ error: err.message })
  }
}
