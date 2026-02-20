// ─── Vercel Serverless Function: POST /api/webhook ───────────
//
// Receives Stripe webhook events and updates the user's Pro status
// in Supabase accordingly.
//
// Required env vars:
//   STRIPE_SECRET_KEY        — Stripe secret key
//   STRIPE_WEBHOOK_SECRET    — Signing secret from Stripe webhook dashboard
//   VITE_SUPABASE_URL        — Your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — Service role key (bypasses RLS)
//
// Stripe events handled:
//   checkout.session.completed      → set is_pro = true
//   customer.subscription.deleted   → set is_pro = false

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Vercel: disable body parsing so we can verify the raw Stripe signature
export const config = {
  api: { bodyParser: false },
}

// ─── Read raw body ────────────────────────────────────────────

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

// ─── Supabase admin client (service role — never sent to browser) ─

function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const stripeKey     = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    console.error('[webhook] Missing Stripe env vars')
    return res.status(500).end()
  }

  const stripe  = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })
  const rawBody = await getRawBody(req)
  const sig     = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const supabase = getAdminClient()

  // ── Handle events ──
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId  = session.client_reference_id
      const stripeCustomerId = session.customer

      if (!userId) {
        console.error('[webhook] checkout.session.completed missing client_reference_id')
        return res.status(200).end() // acknowledge but log
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro:             true,
          stripe_customer_id: stripeCustomerId,
        })
        .eq('id', userId)

      if (error) {
        console.error('[webhook] Failed to set is_pro=true:', error.message)
        return res.status(500).end()
      }

      console.log(`[webhook] ✓ User ${userId} upgraded to Pro`)
    }

    else if (event.type === 'customer.subscription.deleted') {
      const subscription     = event.data.object
      const stripeCustomerId = subscription.customer

      // Look up the user by their Stripe customer ID
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', stripeCustomerId)
        .single()

      if (lookupError || !profile) {
        console.error('[webhook] Could not find user for customer:', stripeCustomerId)
        return res.status(200).end()
      }

      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: false })
        .eq('id', profile.id)

      if (error) {
        console.error('[webhook] Failed to set is_pro=false:', error.message)
        return res.status(500).end()
      }

      console.log(`[webhook] ✓ User ${profile.id} downgraded from Pro`)
    }

    // Acknowledge all other events
    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[webhook] Handler error:', err)
    return res.status(500).end()
  }
}
