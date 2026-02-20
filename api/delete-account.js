// ─── Vercel Serverless Function: POST /api/delete-account ─────
//
// Permanently deletes the authenticated user's account:
//   1. Cancels their Stripe subscription (if active)
//   2. Deletes all entries and profile from Supabase
//   3. Deletes the auth user from Supabase Auth
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

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

  try {
    // ── 1. Cancel Stripe subscription if active ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status:   'active',
          limit:    1,
        })
        if (subscriptions.data.length > 0) {
          await stripe.subscriptions.cancel(subscriptions.data[0].id)
        }
      } catch (stripeErr) {
        // Don't block deletion if Stripe fails — log and continue
        console.error('[delete-account] Stripe cancellation failed:', stripeErr.message)
      }
    }

    // ── 2. Delete entries (RLS cascade handles this but explicit is safer) ──
    await supabase.from('entries').delete().eq('user_id', user.id)

    // ── 3. Delete profile ──
    await supabase.from('profiles').delete().eq('id', user.id)

    // ── 4. Delete the auth user (this is the final step) ──
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    console.log(`[delete-account] ✓ Deleted user ${user.id}`)
    return res.status(200).json({ deleted: true })
  } catch (err) {
    console.error('[delete-account]', err)
    return res.status(500).json({ error: err.message ?? 'Failed to delete account.' })
  }
}
