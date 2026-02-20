// ─── Vercel Serverless Function: POST /api/chat ──────────────
//
// Verifies the user is Pro via Supabase, then calls the Claude API.
// The ANTHROPIC_API_KEY never reaches the browser.
//
// Required env vars:
//   ANTHROPIC_API_KEY        — console.anthropic.com
//   VITE_SUPABASE_URL        — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key

import { createClient } from '@supabase/supabase-js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL             = 'claude-sonnet-4-6'
const MAX_TOKENS        = 1024

// ─── Supabase admin client ────────────────────────────────────

function getAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Verify the user's JWT and check is_pro ───────────────────

async function getProStatus(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return { userId: null, isPro: false }

  const token    = authHeader.slice(7)
  const supabase = getAdminClient()

  // Verify the JWT and get the user
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return { userId: null, isPro: false }

  // Look up is_pro from the profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single()

  return { userId: user.id, isPro: profile?.is_pro ?? false }
}

// ─── Helpers ─────────────────────────────────────────────────

const ENERGY_LABEL = { green: 'High', yellow: 'Medium', red: 'Low' }

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function buildSystemPrompt(profile, entries) {
  const entryContext = entries.length === 0
    ? 'The user has not logged any entries yet.'
    : entries
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((e, i) => {
          const lines = [
            `--- Entry ${i + 1}: ${formatDate(e.date)} ---`,
            `Hours: ${e.hours}h | Energy: ${ENERGY_LABEL[e.energy] ?? e.energy} | Location: ${e.location}`,
          ]
          if (e.worked_on) lines.push(`What I worked on:\n${e.worked_on}`)
          if (e.learned)   lines.push(`What I learned:\n${e.learned}`)
          if (e.blockers)  lines.push(`Blockers & challenges:\n${e.blockers}`)
          if (e.ideas)     lines.push(`Ideas & notes:\n${e.ideas}`)
          if (e.tomorrow)  lines.push(`Tomorrow's plan:\n${e.tomorrow}`)
          return lines.join('\n')
        })
        .join('\n\n')

  return `You are a personal work journal assistant for ${profile.name}.
Their logbook is called "${profile.logbook_name}" and they work at "${profile.organization}".

Your role is to help them reflect on their work, identify patterns, and surface insights from their log entries. Be warm, specific, and concise. Always reference actual entries when relevant — use dates and specifics, not vague generalities. If you notice trends in energy, recurring blockers, or growth in a skill, call those out proactively.

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Total entries: ${entries.length}

=== LOG ENTRIES (newest first) ===

${entryContext}

=== END OF LOG ENTRIES ===

Answer based only on the entries above. If the user asks about something not covered in their logs, say so honestly. Keep responses focused and conversational — no need for long bullet-point lists unless they genuinely help.`
}

// ─── Handler ─────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // ── Pro check (server-side — cannot be bypassed from the browser) ──
  const { userId, isPro } = await getProStatus(req.headers.authorization)

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated.' })
  }

  if (!isPro) {
    return res.status(403).json({
      error: 'AI Chat is a Pro feature. Upgrade to continue.',
      code:  'NOT_PRO',
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' })
  }

  const { messages, entries, profile } = req.body
  if (!messages || !profile) {
    return res.status(400).json({ error: 'Missing required fields: messages, profile.' })
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        system:     buildSystemPrompt(profile, entries ?? []),
        messages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.error?.message ?? `Anthropic API error ${response.status}`
      return res.status(response.status).json({ error: msg })
    }

    const reply = data.content?.[0]?.text
    if (!reply) return res.status(500).json({ error: 'Empty response from Claude.' })

    return res.status(200).json({ reply })
  } catch (err) {
    console.error('[/api/chat]', err)
    return res.status(500).json({ error: err.message || 'Internal server error.' })
  }
}
