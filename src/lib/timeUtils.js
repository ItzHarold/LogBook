/**
 * Compute decimal hours from two "HH:MM" strings.
 * Handles overnight (end < start) by adding 24h.
 */
export function computeHours(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60
  return Math.round(mins) / 60
}

/**
 * Format decimal hours as "8h 30m" or "8h" if exact.
 */
export function formatDuration(hours) {
  if (!hours || hours <= 0) return '—'
  const totalMins = Math.round(hours * 60)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Format a time range for display: "09:00 – 17:30"
 */
export function formatTimeRange(start, end) {
  if (!start || !end) return null
  return `${start} – ${end}`
}

/**
 * Format a 24h "HH:MM" string to 12h with am/pm: "9:00 am"
 */
export function to12h(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}
