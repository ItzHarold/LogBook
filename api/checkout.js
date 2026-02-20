// ─── Vercel Serverless Function: POST /api/checkout ──────────
//
// Creates a Stripe Checkout session and returns the redirect URL.
// The user is sent to Stripe's hosted payment page, then returned
// to the app on success.
//
// Required env vars (set in Vercel → Settings → Environment Variables):
//   STRIPE_SECRET_KEY   — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRICE_ID     — ID of your monthly Pro price (price_...)

import Stripe from 'stripe'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripeKey  = process.env.STRIPE_SECRET_KEY
  const priceId    = process.env.STRIPE_PRICE_ID

  if (!stripeKey || !priceId) {
    return res.status(500).json({
      error: 'Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID to Vercel environment variables.',
    })
  }

  const { userId, userEmail, origin } = req.body

  if (!userId || !origin) {
    return res.status(400).json({ error: 'Missing userId or origin.' })
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],

      // Pass the Supabase user ID so the webhook knows who paid
      client_reference_id: userId,

      // Pre-fill the email field if we have it
      customer_email: userEmail || undefined,

      // Where to send the user after payment
      success_url: `${origin}?upgraded=true`,
      cancel_url:  `${origin}?upgraded=false`,

      // Helpful metadata for your Stripe dashboard
      metadata: { userId },

      subscription_data: {
        metadata: { userId },
      },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[/api/checkout]', err)
    return res.status(500).json({ error: err.message || 'Failed to create checkout session.' })
  }
}
