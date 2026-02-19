// LogBook — AI Chat Edge Function
// Deployed to Supabase, called by the frontend via supabase.functions.invoke()
// The ANTHROPIC_API_KEY secret is stored in Supabase and never exposed to the browser.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ─── CORS ────────────────────────────────────────────────────
// Allow requests from any origin (Vercel preview URLs vary).
// The function is protected by Supabase auth — the client must
// send a valid JWT, which supabase.functions.invoke() does automatically.

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Entry formatter ─────────────────────────────────────────

function formatEntry(entry: Record<string, unknown>): string {
  const lines: string[] = [
    `DATE: ${entry.date}`,
    `HOURS: ${entry.hours}`,
    `ENERGY: ${entry.energy === 'green' ? 'High' : entry.energy === 'yellow' ? 'Medium' : 'Low'}`,
    `LOCATION: ${entry.location}`,
  ]
  if (entry.worked_on) lines.push(`WORKED ON: ${entry.worked_on}`)
  if (entry.learned)   lines.push(`LEARNED: ${entry.learned}`)
  if (entry.blockers)  lines.push(`BLOCKERS: ${entry.blockers}`)
  if (entry.ideas)     lines.push(`IDEAS: ${entry.ideas}`)
  if (entry.tomorrow)  lines.push(`TOMORROW: ${entry.tomorrow}`)
  return lines.join('\n')
}

// ─── System prompt builder ────────────────────────────────────

function buildSystemPrompt(
  profile: Record<string, string>,
  entries: Record<string, unknown>[]
): string {
  const entryBlock = entries.length > 0
    ? entries.map(formatEntry).join('\n\n---\n\n')
    : 'No entries logged yet.'

  return `You are a warm, insightful personal work journal assistant for ${profile.name}.
Their logbook is called "${profile.logbook_name}" and they work at "${profile.organization}".

You have access to all of their log entries below. Use them to give specific, thoughtful answers.
Reference actual dates, patterns, and details from the entries when relevant.
Be encouraging but honest. Keep responses concise and conversational — avoid long bullet lists unless genuinely needed.

Today's date: ${new Date().toISOString().split('T')[0]}
Total entries: ${entries.length}

━━━ LOG ENTRIES (newest first) ━━━

${entryBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
}

// ─── Handler ─────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { messages, entries, profile } = await req.json()

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY secret is not set. Run: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...')
    }

    const systemPrompt = buildSystemPrompt(profile, entries ?? [])

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key':         apiKey,
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system:     systemPrompt,
        messages:   messages, // [{ role: 'user'|'assistant', content: string }]
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(err?.error?.message ?? `Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    return new Response(
      JSON.stringify({ reply: text }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('[chat function]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
