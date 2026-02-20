import { useState } from 'react'
import { generatePDF } from '../lib/generatePDF'
import GDriveConnect from '../components/GDrive/GDriveConnect'

const ENERGY_COLOR = { green: '#4ade80', yellow: '#facc15', red: '#f87171' }
const ENERGY_LABEL = { green: 'High', yellow: 'Medium', red: 'Low' }
const ENERGY_DIM   = { green: 'var(--green-dim)', yellow: 'var(--yellow-dim)', red: 'var(--red-dim)' }

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
}

function truncate(str, n = 120) {
  if (!str || str.length <= n) return str
  return str.slice(0, n).trimEnd() + '…'
}

function EntryCard({ entry, onDelete, profile, gDrive }) {
  const [deleting, setDeleting]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('') // '' | 'uploading' | 'done' | 'error'
  const [uploadMsg, setUploadMsg]       = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(entry.id)
    } catch (err) {
      console.error('Delete failed:', err)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleGDrive = async () => {
    setUploadStatus('uploading')
    setUploadMsg('')
    const ok = await gDrive.uploadPDF(entry, profile)
    if (ok) {
      setUploadStatus('done')
      setUploadMsg('Saved to OneDrive ✓')
    } else {
      setUploadStatus('error')
      setUploadMsg(gDrive.uploadError || 'Upload failed')
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardLeft}>
          <div
            style={{
              ...styles.energyDot,
              background: ENERGY_COLOR[entry.energy],
              boxShadow: `0 0 8px ${ENERGY_COLOR[entry.energy]}50`,
            }}
            title={`${ENERGY_LABEL[entry.energy]} energy`}
          />
          <div>
            <div style={styles.cardDate}>{formatDate(entry.date)}</div>
            <div style={styles.cardMeta}>
              <span style={{ color: ENERGY_COLOR[entry.energy], fontSize: '12px' }}>
                {ENERGY_LABEL[entry.energy]} energy
              </span>
              <span style={styles.sep}>·</span>
              <span>{entry.hours}h</span>
              <span style={styles.sep}>·</span>
              <span>{entry.location}</span>
            </div>
          </div>
        </div>

        <div style={styles.cardActions}>
          {/* Download PDF */}
          <button
            className="btn btn-ghost"
            style={{ fontSize: '12px' }}
            title="Download PDF"
            onClick={() => generatePDF(entry, profile)}
          >
            ↓ PDF
          </button>

          {/* Save to Google Drive */}
          {gDrive.isConnected && (
            <button
              className="btn btn-ghost"
              style={{
                fontSize: '12px',
                color: uploadStatus === 'done' ? 'var(--green)' : 'var(--text-secondary)',
                opacity: uploadStatus === 'uploading' ? 0.6 : 1,
              }}
              title={uploadStatus === 'done' ? uploadMsg : 'Save to Google Drive'}
              onClick={handleGDrive}
              disabled={uploadStatus === 'uploading' || uploadStatus === 'done'}
            >
              {uploadStatus === 'uploading'
                ? <div className="spinner" style={{ width: '10px', height: '10px', borderTopColor: 'currentColor' }} />
                : uploadStatus === 'done' ? '☁ Saved' : '☁ Drive'}
            </button>
          )}

          {/* Delete */}
          {!confirmDelete ? (
            <button
              className="btn btn-ghost"
              style={{ fontSize: '12px', color: 'var(--red)', opacity: 0.7 }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          ) : (
            <div style={styles.deleteConfirm}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sure?</span>
              <button
                className="btn btn-danger"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? <div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: 'var(--red)' }} />
                  : 'Yes, delete'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

{(() => {
        // Show custom_data fields if present, else fall back to legacy fixed columns
        const customEntries = entry.custom_data ? Object.entries(entry.custom_data).filter(([, v]) => v !== '' && v !== false && v != null) : []
        const legacyFields = [
          entry.worked_on && ['Worked on', entry.worked_on],
          entry.learned   && ['Learned',   entry.learned],
          entry.blockers  && ['Blockers',  entry.blockers],
        ].filter(Boolean)
        const rows = customEntries.length ? customEntries : legacyFields
        if (!rows.length) return null
        return (
          <div style={styles.cardBody}>
            {rows.map(([key, val], i) => (
              <div key={i} style={styles.previewRow}>
                <span style={styles.previewLabel}>{key.replace(/_/g, ' ')}</span>
                <span style={styles.previewText}>
                  {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : truncate(String(val))}
                </span>
              </div>
            ))}
          </div>
        )
      })()}

      {uploadStatus === 'error' && (
        <div style={styles.uploadError}>⚠ {uploadMsg}</div>
      )}

      <div style={{
        ...styles.energyChip,
        background: ENERGY_DIM[entry.energy],
        borderColor: `${ENERGY_COLOR[entry.energy]}30`,
      }}>
        <div style={{ ...styles.chipDot, background: ENERGY_COLOR[entry.energy] }} />
        <span style={{ color: ENERGY_COLOR[entry.energy] }}>
          {entry.hours}h · {ENERGY_LABEL[entry.energy]}
        </span>
      </div>
    </div>
  )
}

export default function History({ profile, entries, entriesLoading, deleteEntry, setPage, gDrive }) {
  if (entriesLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
        <div className="spinner spinner-lg" style={{ borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-sub">
            {entries.length > 0
              ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} in ${profile.logbook_name}`
              : profile.logbook_name}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* OneDrive connect toggle in the header */}
          <GDriveConnect
            isConnected={gDrive.isConnected}
            connect={gDrive.connect}
            disconnect={gDrive.disconnect}
          />
          {entries.length > 0 && (
            <button className="btn btn-primary" onClick={() => setPage('new-entry')}>
              + New Entry
            </button>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🗂️</div>
            <h3>No entries yet</h3>
            <p>Your logged work days will appear here.</p>
            <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={() => setPage('new-entry')}>
              Log your first day →
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onDelete={deleteEntry}
              profile={profile}
              gDrive={gDrive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: '28px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '30px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  sub: { fontSize: '14px', color: 'var(--text-secondary)' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 22px',
    transition: 'border-color var(--t-normal)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  cardLeft: { display: 'flex', alignItems: 'flex-start', gap: '14px' },
  energyDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: '5px',
  },
  cardDate: { fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    flexWrap: 'wrap',
  },
  sep: { color: 'var(--text-muted)' },
  cardActions: { display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, flexWrap: 'wrap' },
  deleteConfirm: { display: 'flex', alignItems: 'center', gap: '6px' },
  cardBody: {
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  previewRow: { display: 'flex', gap: '10px', fontSize: '13px', alignItems: 'flex-start' },
  previewLabel: {
    color: 'var(--text-muted)',
    flexShrink: 0,
    width: '72px',
    paddingTop: '1px',
  },
  previewText: { color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 },
  uploadError: {
    marginTop: '8px',
    fontSize: '12px',
    color: 'var(--red)',
  },
  energyChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '14px',
    padding: '4px 10px',
    borderRadius: '99px',
    border: '1px solid transparent',
    fontSize: '12px',
    fontWeight: 500,
  },
  chipDot: { width: '6px', height: '6px', borderRadius: '50%' },
}
