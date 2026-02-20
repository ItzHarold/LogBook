// ─── Vercel Serverless Function: POST /api/delete-account ─────

import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function handler(req, res) {
  // Always respond with JSON
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  try {
    // ── Auth check ──
    const authHeader = req.headers.authorization ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }

    const supabase = getAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7))
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token.' })
    }

    // ── 1. Cancel Stripe subscription if applicable ──
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
        const Stripe   = (await import('stripe')).default
        const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
        const subs     = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status:   'active',
          limit:    1,
        })
        if (subs.data.length > 0) {
          await stripe.subscriptions.cancel(subs.data[0].id)
        }
      }
    } catch (stripeErr) {
      // Non-fatal — log and continue with deletion
      console.error('[delete-account] Stripe step failed:', stripeErr.message)
    }

    // ── 2. Delete entries ──
    await supabase.from('entries').delete().eq('user_id', user.id)

    // ── 3. Delete profile ──
    await supabase.from('profiles').delete().eq('id', user.id)

    // ── 4. Delete auth user ──
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteError) throw new Error(deleteError.message)

    console.log(`[delete-account] ✓ Deleted user ${user.id}`)
    return res.status(200).json({ deleted: true })

  } catch (err) {
    console.error('[delete-account] Fatal:', err)
    return res.status(500).json({ error: err.message ?? 'Failed to delete account.' })
  }
}
