import { useState } from 'react'

function GoogleDriveLogo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4.5 20.25l2.25-3.897h13.5L18 20.25H4.5z" fill="#3777E3"/>
      <path d="M1.5 14.672l2.25 3.897 3.75-6.494L5.25 8.18 1.5 14.672z" fill="#FFBA00"/>
      <path d="M14.25 8.18l-3.75 6.494h7.5l3.75-6.494h-7.5zM5.25 8.18h9L10.5 2.25 5.25 8.18z" fill="#00AC47"/>
    </svg>
  )
}

export default function GDriveConnect({ isConnected, connect, disconnect }) {
  const [confirming, setConfirming] = useState(false)

  if (isConnected) {
    return (
      <div style={styles.row}>
        <div style={styles.connected}>
          <GoogleDriveLogo size={14} />
          <span>Google Drive connected</span>
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
      <GoogleDriveLogo size={14} />
      Connect Google Drive
    </button>
  )
}

const styles = {
  row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
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
  disconnectBtn: { fontSize: '12px', color: 'var(--text-muted)', padding: '4px 8px' },
  connectBtn: { fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' },
  confirmRow: { display: 'flex', alignItems: 'center', gap: '6px' },
}
