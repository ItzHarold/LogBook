import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { formatDuration, to12h } from '../lib/timeUtils'

const ENERGY_VALUE = { green: 3, yellow: 2, red: 1 }
const ENERGY_COLOR = { green: '#4ade80', yellow: '#facc15', red: '#f87171' }
const ENERGY_LABEL = { green: 'High', yellow: 'Medium', red: 'Low' }

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StatCard({ label, value, sub, accent, mono }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{
        ...styles.statValue,
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
        fontFamily: mono ? 'var(--font-body)' : 'var(--font-heading)',
        fontSize: mono ? '22px' : '30px',
      }}>
        {value}
      </div>
      {sub && <div style={styles.statSub}>{sub}</div>}
    </div>
  )
}

function CustomTooltip({ active, payload, label, energyMode }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{label}</div>
      <div style={styles.tooltipValue}>
        {energyMode
          ? val === 3 ? '🟢 High' : val === 2 ? '🟡 Medium' : '🔴 Low'
          : formatDuration(val)}
      </div>
    </div>
  )
}

function EnergyDot({ cx, cy, payload }) {
  const color = ENERGY_COLOR[payload?.energyKey] ?? '#8a8599'
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="var(--bg)" strokeWidth={2} />
}

export default function Dashboard({ profile, entries, entriesLoading, setPage }) {
  const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0)
  const avgHours   = entries.length ? totalHours / entries.length : 0

  // Typical start/end time (median of entries that have times)
  const timedEntries = entries.filter((e) => e.start_time && e.end_time)
  const avgStartMins = timedEntries.length
    ? timedEntries.reduce((s, e) => {
        const [h, m] = e.start_time.split(':').map(Number)
        return s + h * 60 + m
      }, 0) / timedEntries.length
    : null
  const avgEndMins = timedEntries.length
    ? timedEntries.reduce((s, e) => {
        const [h, m] = e.end_time.split(':').map(Number)
        return s + h * 60 + m
      }, 0) / timedEntries.length
    : null

  const toTimeStr = (mins) => {
    if (mins == null) return null
    const h = Math.floor(mins / 60) % 24
    const m = Math.round(mins % 60)
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  }
  const avgStart = toTimeStr(avgStartMins)
  const avgEnd   = toTimeStr(avgEndMins)

  const energyCount = { green: 0, yellow: 0, red: 0 }
  entries.forEach((e) => { energyCount[e.energy] = (energyCount[e.energy] || 0) + 1 })

  const chartEntries = [...entries]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30)

  const chartData = chartEntries.map((e) => ({
    date:      formatDate(e.date),
    hours:     parseFloat(e.hours || 0),
    energy:    ENERGY_VALUE[e.energy],
    energyKey: e.energy,
  }))

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

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
          <p style={styles.greeting}>{greeting}, {profile.name}.</p>
          <h1 className="page-title">{profile.logbook_name}</h1>
        </div>
        {entries.length > 0 && (
          <button className="btn btn-primary" onClick={() => setPage('new-entry')}>+ New Entry</button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="card" style={{ marginTop: '32px' }}>
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>Your logbook is empty</h3>
            <p>Start tracking your work days. Log what you worked on, what you learned, and how you felt — and watch the insights build over time.</p>
            <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={() => setPage('new-entry')}>
              Log your first day →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid" style={styles.statsGrid}>
            <StatCard
              label="Total time logged"
              value={formatDuration(totalHours)}
              sub={`across ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
              accent mono
            />
            <StatCard label="Days logged" value={entries.length} sub="unique work entries" />
            <StatCard
              label="Avg. work day"
              value={formatDuration(avgHours)}
              sub={avgStart && avgEnd ? `${to12h(avgStart)} – ${to12h(avgEnd)}` : 'per entry'}
              mono
            />
            <StatCard
              label="Last entry"
              value={formatDate(entries[0]?.date)}
              sub={`${ENERGY_LABEL[entries[0]?.energy]} energy`}
              mono
            />
          </div>

          {/* Charts */}
          {chartData.length >= 2 && (
            <div className="charts-grid" style={styles.chartsGrid}>
              <div className="card" style={styles.chartCard}>
                <h2 style={styles.chartTitle}>Energy over time</h2>
                <p style={styles.chartSub}>Last {chartData.length} entries</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[0.5, 3.5]} ticks={[1,2,3]} tickFormatter={(v) => v===3?'High':v===2?'Med':'Low'} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip energyMode />} />
                    <Line type="monotone" dataKey="energy" stroke="var(--accent)" strokeWidth={2} dot={<EnergyDot />} activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--bg)', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={styles.chartCard}>
                <h2 style={styles.chartTitle}>Time logged per day</h2>
                <p style={styles.chartSub}>Last {chartData.length} entries</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="hours" fill="var(--accent)" opacity={0.85} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Energy distribution */}
          <div className="card" style={styles.energyCard}>
            <h2 style={styles.chartTitle}>Energy distribution</h2>
            <div style={styles.energyRows}>
              {['green', 'yellow', 'red'].map((key) => {
                const pct = entries.length ? (energyCount[key] / entries.length) * 100 : 0
                return (
                  <div key={key} style={styles.energyItem}>
                    <div style={styles.energyMeta}>
                      <span style={{ color: ENERGY_COLOR[key], fontWeight: 500, fontSize: '13px' }}>
                        {ENERGY_LABEL[key]}
                      </span>
                      <span style={styles.energyCount}>
                        {energyCount[key]} {energyCount[key] === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <div style={{ ...styles.energyBar, background: `${ENERGY_COLOR[key]}18` }}>
                      <div style={{
                        ...styles.energyFill,
                        width: `${pct}%`,
                        background: ENERGY_COLOR[key],
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  greeting: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 22px',
  },
  statLabel: {
    fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px',
  },
  statValue: {
    fontFamily: 'var(--font-heading)',
    fontSize: '30px', fontWeight: 600, lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  statSub: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  chartCard: { padding: '22px 24px' },
  chartTitle: {
    fontFamily: 'var(--font-heading)', fontSize: '15px',
    fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px',
  },
  chartSub: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' },
  energyCard: { padding: '22px 24px' },
  energyRows: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' },
  energyItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  energyMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  energyCount: { fontSize: '12px', color: 'var(--text-muted)' },
  energyBar: { height: '8px', borderRadius: '99px', overflow: 'hidden' },
  energyFill: { height: '100%', borderRadius: '99px', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' },
  tooltip: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
  },
  tooltipLabel: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' },
  tooltipValue: { fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' },
}
