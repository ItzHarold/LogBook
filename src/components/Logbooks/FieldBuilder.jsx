import { useState } from 'react'

const FIELD_TYPES = [
  { value: 'textarea', label: '¶  Long text' },
  { value: 'text',     label: 'T  Short text' },
  { value: 'number',   label: '#  Number' },
  { value: 'date',     label: '📅 Date' },
  { value: 'time',     label: '⏱  Time' },
  { value: 'select',   label: '▾  Dropdown' },
  { value: 'checkbox', label: '☑  Yes / No' },
]

function FieldRow({ field, index, total, onChange, onRemove, onMove }) {
  const [optionInput, setOptionInput] = useState('')

  const addOption = () => {
    const val = optionInput.trim()
    if (!val) return
    onChange(index, { ...field, options: [...(field.options ?? []), val] })
    setOptionInput('')
  }

  const removeOption = (oi) => {
    onChange(index, { ...field, options: field.options.filter((_, i) => i !== oi) })
  }

  return (
    <div style={styles.fieldRow}>
      <div style={styles.fieldRowHeader}>
        <div style={styles.moveButtons}>
          <button type="button" style={styles.moveBtn} onClick={() => onMove(index, -1)} disabled={index === 0}>▴</button>
          <button type="button" style={styles.moveBtn} onClick={() => onMove(index, 1)}  disabled={index === total - 1}>▾</button>
        </div>

        <input
          className="input"
          style={styles.labelInput}
          placeholder="Field name..."
          value={field.label}
          onChange={(e) => onChange(index, { ...field, label: e.target.value })}
        />

        <select
          className="input"
          style={styles.typeSelect}
          value={field.type}
          onChange={(e) => onChange(index, { ...field, type: e.target.value, options: [] })}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <button
          type="button"
          style={{ ...styles.requiredBtn, ...(field.required ? styles.requiredBtnOn : {}) }}
          onClick={() => onChange(index, { ...field, required: !field.required })}
          title={field.required ? 'Required' : 'Optional'}
        >
          {field.required ? '★' : '☆'}
        </button>

        <button type="button" style={styles.removeBtn} onClick={() => onRemove(index)}>✕</button>
      </div>

      {field.type === 'select' && (
        <div style={styles.optionsWrap}>
          <div style={styles.optionsList}>
            {(field.options ?? []).map((opt, oi) => (
              <span key={oi} style={styles.optionChip}>
                {opt}
                <button type="button" style={styles.optionRemove} onClick={() => removeOption(oi)}>✕</button>
              </span>
            ))}
            {(!field.options || field.options.length === 0) && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No options yet</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              className="input"
              style={{ ...styles.labelInput, flex: 1 }}
              placeholder="Add option..."
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
            />
            <button type="button" className="btn btn-secondary"
              style={{ fontSize: '12px', height: '34px', padding: '0 12px', flexShrink: 0 }}
              onClick={addOption}
            >Add</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FieldBuilder({ fields, onChange }) {
  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.label}>Custom fields</span>
        <span style={styles.hint}>Locked once the logbook is created · ★ = required</span>
      </div>

      {fields.length === 0 ? (
        <div style={styles.empty}>
          Only core fields will be logged: date, hours, energy, location.
        </div>
      ) : (
        <div style={styles.list}>
          {fields.map((field, i) => (
            <FieldRow
              key={i}
              field={field}
              index={i}
              total={fields.length}
              onChange={(idx, val) => {
                const next = [...fields]
                next[idx] = val
                onChange(next)
              }}
              onRemove={(idx) => onChange(fields.filter((_, i) => i !== idx))}
              onMove={(idx, dir) => {
                const next = [...fields]
                const t = idx + dir
                if (t < 0 || t >= next.length) return
                ;[next[idx], next[t]] = [next[t], next[idx]]
                onChange(next)
              }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        style={styles.addBtn}
        onClick={() => onChange([...fields, { label: '', type: 'textarea', required: false, options: [] }])}
      >
        <span style={styles.addIcon}>+</span>
        Add a field
      </button>
    </div>
  )
}

const styles = {
  root: { marginTop: '14px' },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  hint: { fontSize: '11px', color: 'var(--text-muted)' },
  list: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' },
  empty: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    padding: '10px 12px',
    background: 'var(--bg)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    marginBottom: '8px',
    lineHeight: 1.5,
  },
  fieldRow: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '7px 8px',
  },
  fieldRowHeader: { display: 'flex', alignItems: 'center', gap: '5px' },
  moveButtons: { display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 },
  moveBtn: {
    background: 'none', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer',
    padding: '0 2px', fontSize: '10px', lineHeight: 1,
    fontFamily: 'var(--font-body)',
  },
  labelInput: { flex: 1, minWidth: 0, fontSize: '13px', padding: '6px 8px', height: '34px' },
  typeSelect: { width: '124px', flexShrink: 0, fontSize: '12px', padding: '6px 6px', height: '34px', cursor: 'pointer' },
  requiredBtn: {
    background: 'none', border: '1px solid var(--border)', borderRadius: '5px',
    color: 'var(--text-muted)', cursor: 'pointer',
    padding: '0 7px', height: '34px', fontSize: '14px',
    fontFamily: 'var(--font-body)', flexShrink: 0, transition: 'all var(--t-fast)',
  },
  requiredBtnOn: {
    background: 'var(--accent-dim)',
    borderColor: 'rgba(240,192,96,0.3)',
    color: 'var(--accent)',
  },
  removeBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: '11px', padding: '4px 5px',
    flexShrink: 0, fontFamily: 'var(--font-body)',
  },
  optionsWrap: {
    marginTop: '7px', paddingTop: '7px',
    borderTop: '1px solid var(--border)',
  },
  optionsList: {
    display: 'flex', flexWrap: 'wrap', gap: '5px',
    marginBottom: '7px', minHeight: '6px',
  },
  optionChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '99px', padding: '2px 9px',
    fontSize: '12px', color: 'var(--text-secondary)',
  },
  optionRemove: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: '9px', padding: 0,
    lineHeight: 1, fontFamily: 'var(--font-body)',
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '8px 10px',
    background: 'none', border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)',
  },
  addIcon: {
    width: '18px', height: '18px', borderRadius: '4px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', color: 'var(--accent)',
  },
}
