// Phase 3: Claude API integration
// This page will be wired up with real AI chat in Phase 3.

const EXAMPLE_PROMPTS = [
  "What did I struggle with most this month?",
  "Summarize what I learned last week",
  "How has my energy level been trending?",
  "What topics keep showing up in my work?",
  "What should I focus on tomorrow based on my patterns?",
]

export default function AIChat({ profile, entries }) {
  return (
    <div className="page-fade">
      <div style={styles.header}>
        <h1 style={styles.title}>AI Chat</h1>
        <p style={styles.sub}>Chat with your logbook — ask questions, spot patterns, get insights.</p>
      </div>

      <div className="card" style={styles.previewCard}>
        <div style={styles.comingSoon}>
          <span style={styles.badge}>Phase 3</span>
          <h2 style={styles.comingSoonTitle}>AI Chat is coming soon</h2>
          <p style={styles.comingSoonText}>
            Once integrated, your AI assistant will have full access to all{' '}
            <strong style={{ color: 'var(--accent)' }}>{entries.length} entries</strong> in{' '}
            <em>{profile.logbook_name}</em> and can answer questions like:
          </p>
          <div style={styles.prompts}>
            {EXAMPLE_PROMPTS.map((p, i) => (
              <div key={i} style={styles.prompt}>
                <span style={styles.promptIcon}>✦</span>
                <span>"{p}"</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock chat preview */}
        <div style={styles.chatPreview} aria-hidden>
          <div style={styles.chatScrim} />
          <div style={styles.msgAssistant}>
            <div style={styles.avatar}>✦</div>
            <div style={styles.bubble}>
              Hi {profile.name}! I've read through your {entries.length} log {entries.length === 1 ? 'entry' : 'entries'}.
              What would you like to explore today?
            </div>
          </div>
          <div style={styles.msgUser}>
            <div style={styles.bubbleUser}>What have I been struggling with most?</div>
          </div>
          <div style={styles.msgAssistant}>
            <div style={styles.avatar}>✦</div>
            <div style={{ ...styles.bubble, opacity: 0.4 }}>
              Analysing your entries
              <span style={styles.blinkDot} />
            </div>
          </div>
        </div>

        <div style={styles.inputRow}>
          <input
            className="input"
            placeholder={`Ask anything about your ${profile.logbook_name}…`}
            disabled
            style={{ opacity: 0.4, cursor: 'not-allowed' }}
          />
          <button className="btn btn-primary" disabled style={{ flexShrink: 0, opacity: 0.4 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  header: { marginBottom: '28px' },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '30px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  sub: { fontSize: '14px', color: 'var(--text-secondary)' },
  previewCard: { padding: 0, overflow: 'hidden' },
  comingSoon: {
    padding: '32px 32px 28px',
    borderBottom: '1px solid var(--border)',
  },
  badge: {
    display: 'inline-block',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(240, 192, 96, 0.2)',
    borderRadius: '99px',
    padding: '3px 12px',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '16px',
  },
  comingSoonTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '22px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '10px',
    letterSpacing: '-0.01em',
  },
  comingSoonText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: '20px',
  },
  prompts: { display: 'flex', flexDirection: 'column', gap: '8px' },
  prompt: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  promptIcon: { color: 'var(--accent)', flexShrink: 0, marginTop: '1px', opacity: 0.7 },
  chatPreview: {
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
    opacity: 0.65,
    pointerEvents: 'none',
  },
  chatScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'linear-gradient(to top, var(--bg-card), transparent)',
    zIndex: 1,
  },
  msgAssistant: { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(240, 192, 96, 0.2)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    flexShrink: 0,
  },
  bubble: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '0 var(--radius) var(--radius) var(--radius)',
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    maxWidth: '80%',
    lineHeight: 1.6,
  },
  msgUser: { display: 'flex', justifyContent: 'flex-end' },
  bubbleUser: {
    background: 'var(--accent-dim)',
    border: '1px solid rgba(240, 192, 96, 0.15)',
    borderRadius: 'var(--radius) 0 var(--radius) var(--radius)',
    padding: '10px 14px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    maxWidth: '80%',
    lineHeight: 1.6,
  },
  blinkDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--text-muted)',
    marginLeft: '6px',
    animation: 'pulse 1.2s ease infinite',
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
  },
}
