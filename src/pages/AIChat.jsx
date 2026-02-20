import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import UpgradeWall from '../components/Pro/UpgradeWall'

// ─── Constants ────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "What did I struggle with most recently?",
  "Summarize what I learned this month",
  "How has my energy been trending?",
  "What topics keep coming up in my work?",
  "What should I focus on tomorrow?",
  "Which days were my most productive?",
]

// ─── Sub-components ───────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={styles.msgRow}>
      <div style={styles.avatarAssistant}>✦</div>
      <div style={styles.typingBubble}>
        <span style={{ ...styles.typingDot, animationDelay: '0ms'   }} />
        <span style={{ ...styles.typingDot, animationDelay: '160ms' }} />
        <span style={{ ...styles.typingDot, animationDelay: '320ms' }} />
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isAssistant = msg.role === 'assistant'
  return (
    <div style={{ ...styles.msgRow, ...(isAssistant ? {} : styles.msgRowUser) }}>
      {isAssistant && <div style={styles.avatarAssistant}>✦</div>}
      <div style={isAssistant ? styles.bubbleAssistant : styles.bubbleUser}>
        {msg.content.split('\n').map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function AIChat({ profile, entries, user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [started, setStarted]   = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  // Greeting on mount
  useEffect(() => {
    const hour     = new Date().getHours()
    const tod      = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    const entryWord = entries.length === 1 ? 'entry' : 'entries'
    setMessages([{
      role: 'assistant',
      content: `Good ${tod}, ${profile.name}! I've read through all ${entries.length} ${entryWord} in your ${profile.logbook_name}.\n\nAsk me anything — patterns, blockers, what you've been learning, or how your energy has been trending.`,
    }])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Send message ──
  const send = async (text) => {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    setInput('')
    setError('')
    setStarted(true)

    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Get the current session token to prove identity server-side
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const history = newMessages
        .slice(1) // drop local greeting
        .map(({ role, content }) => ({ role, content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history, entries, profile }),
      })

      const data = await res.json()

      // Server returned NOT_PRO — shouldn't happen if wall is shown,
      // but handle gracefully just in case
      if (res.status === 403 && data.code === 'NOT_PRO') {
        setError('Your session may be out of date. Please refresh the page.')
        setMessages((prev) => prev.slice(0, -1))
        setStarted(messages.length > 1)
        return
      }

      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      console.error('[AIChat]', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setMessages((prev) => prev.slice(0, -1))
      setStarted(messages.length > 1)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleClear = () => {
    const hour      = new Date().getHours()
    const tod       = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    const entryWord = entries.length === 1 ? 'entry' : 'entries'
    setMessages([{
      role: 'assistant',
      content: `Good ${tod}, ${profile.name}! I've read through all ${entries.length} ${entryWord} in your ${profile.logbook_name}.\n\nAsk me anything — patterns, blockers, what you've been learning, or how your energy has been trending.`,
    }])
    setStarted(false)
    setError('')
    setInput('')
  }

  const hasEntries = entries.length > 0
  const isPro      = profile.is_pro === true

  return (
    <div className="page-fade" style={styles.root}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            AI Chat
            {isPro && <span style={styles.proBadge}>Pro</span>}
          </h1>
          <p style={styles.sub}>
            {isPro
              ? hasEntries
                ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} loaded as context`
                : 'Log some entries first to unlock full insights'
              : 'Upgrade to Pro to unlock AI Chat'}
          </p>
        </div>
        {isPro && messages.length > 1 && (
          <button className="btn btn-secondary" onClick={handleClear} style={{ fontSize: '13px' }}>
            ↺ New conversation
          </button>
        )}
      </div>

      {/* ── Upgrade wall (free users) ── */}
      {!isPro && <UpgradeWall user={user} />}

      {/* ── Chat (Pro users) ── */}
      {isPro && (
        <div style={styles.chatCard}>
          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          {!started && hasEntries && (
            <div style={styles.suggestions}>
              <p style={styles.suggestionsLabel}>Suggested questions</p>
              <div style={styles.chips}>
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    className="btn"
                    style={styles.chip}
                    onClick={() => send(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No entries warning */}
          {!hasEntries && (
            <div style={styles.noEntries}>
              <span style={styles.noEntriesIcon}>📝</span>
              <p>Log at least one work day first — the AI needs your entries to give meaningful answers.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBanner}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* Input */}
          <div style={styles.inputRow}>
            <textarea
              ref={inputRef}
              className="input"
              style={styles.textarea}
              placeholder={hasEntries
                ? `Ask anything about your ${profile.logbook_name}…`
                : 'Log some entries first…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading || !hasEntries}
            />
            <button
              className="btn btn-primary"
              style={{ flexShrink: 0, alignSelf: 'flex-end', height: '40px', minWidth: '72px' }}
              onClick={() => send()}
              disabled={loading || !input.trim() || !hasEntries}
            >
              {loading
                ? <div className="spinner" style={{ borderTopColor: '#0f0f13', width: '16px', height: '16px' }} />
                : 'Send'
              }
            </button>
          </div>

          <p style={styles.hint}>
            Press <kbd style={styles.kbd}>Enter</kbd> to send · <kbd style={styles.kbd}>Shift+Enter</kbd> for new line
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 80px)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '16px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '30px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  proBadge: {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(240, 192, 96, 0.3)',
    borderRadius: '99px',
    padding: '3px 10px',
    verticalAlign: 'middle',
  },
  sub: { fontSize: '14px', color: 'var(--text-secondary)' },
  chatCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 24px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    animation: 'fadeIn 0.2s ease both',
  },
  msgRowUser: { justifyContent: 'flex-end' },
  avatarAssistant: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(240, 192, 96, 0.25)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    flexShrink: 0,
    marginTop: '2px',
  },
  bubbleAssistant: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '0 var(--radius) var(--radius) var(--radius)',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    maxWidth: '78%',
    lineHeight: 1.7,
  },
  bubbleUser: {
    background: 'var(--accent-dim)',
    border: '1px solid rgba(240, 192, 96, 0.18)',
    borderRadius: 'var(--radius) 0 var(--radius) var(--radius)',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    maxWidth: '78%',
    lineHeight: 1.7,
  },
  typingBubble: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '0 var(--radius) var(--radius) var(--radius)',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  typingDot: {
    display: 'inline-block',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--text-muted)',
    animation: 'pulse 1.1s ease infinite',
  },
  suggestions: {
    padding: '0 24px 16px',
    flexShrink: 0,
  },
  suggestionsLabel: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '10px',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  chip: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '99px',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    padding: '6px 14px',
    cursor: 'pointer',
    transition: 'all var(--t-fast)',
    fontFamily: 'var(--font-body)',
  },
  noEntries: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '0 24px 16px',
    padding: '12px 16px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  noEntriesIcon: { fontSize: '20px', flexShrink: 0 },
  errorBanner: {
    margin: '0 24px 12px',
    padding: '10px 14px',
    background: 'var(--red-dim)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--red)',
    fontSize: '13px',
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    padding: '12px 24px 8px',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  textarea: {
    resize: 'none',
    lineHeight: 1.6,
    padding: '10px 14px',
    maxHeight: '120px',
    overflowY: 'auto',
  },
  hint: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    padding: '0 24px 14px',
    flexShrink: 0,
  },
  kbd: {
    display: 'inline-block',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '1px 5px',
    fontSize: '10px',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-muted)',
  },
}
