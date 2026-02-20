import { useState } from 'react'

// Simple OneDrive logo SVG
function OneDriveLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10.5 13.5L6.7 10.1C7.7 7.7 10.1 6 12.9 6c2.1 0 4 .9 5.3 2.4l-7.7 5.1zM20.9 9.7C19.4 8.1 17.3 7 15 7c-.2 0-.4 0-.6.1-1.7-2.5-4.5-4.1-7.7-4.1C3 3 0 6 0 9.7c0 1.4.4 2.7 1.2 3.8L1 13.7C.4 14.8 0 16.1 0 17.5 0 21 2.9 24 6.4 24h12.8c2.6 0 4.8-2.1 4.8-4.8 0-1.5-.7-2.9-1.8-3.8l.3-.5c.3-.7.5-1.5.5-2.3 0-.7-.1-1.3-.1-2.9z"/>
    </svg>
  )
}

/**
 * A small button to connect or disconnect OneDrive.
 * Accepts the `useOneDrive` hook return value as props.
 */
export default function OneDriveConnect({ isConnected, connect, disconnect }) {
  const [confirming, setConfirming] = useState(false)

  if (isConnected) {
    return (
      <div style={styles.row}>
        <div style={styles.connected}>
          <OneDriveLogo size={14} />
          <span>OneDrive connected</span>
        </div>
        {!confirming ? (
          <button
            className="btn btn-ghost"
            style={styles.disconnectBtn}
            onClick={() => setConfirming(true)}
          >
            Disconnect
          </button>
        ) : (
          <div style={styles.confirmRow}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sure?</span>
            <button
              className="btn btn-danger"
              style={{ padding: '3px 10px', fontSize: '12px' }}
              onClick={() => { disconnect(); setConfirming(false) }}
            >
              Yes
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '3px 8px', fontSize: '12px' }}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button className="btn btn-secondary" style={styles.connectBtn} onClick={connect}>
      <OneDriveLogo size={14} />
      Connect OneDrive
    </button>
  )
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  connected: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--green)',
    background: 'var(--green-dim)',
    border: '1px solid rgba(74, 222, 128, 0.2)',
    borderRadius: '99px',
    padding: '4px 12px',
  },
  disconnectBtn: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    padding: '4px 8px',
  },
  connectBtn: {
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  confirmRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
}
