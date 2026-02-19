import { jsPDF } from 'jspdf'

// ─── Design constants ─────────────────────────────────────────

const C = {
  // Page
  PAGE_W: 210,   // A4 mm
  PAGE_H: 297,
  MARGIN: 20,
  CONTENT_W: 170, // PAGE_W - MARGIN * 2

  // Colors (RGB)
  BG:           [15,  15,  19],   // #0f0f13
  BG_SECTION:   [28,  28,  37],   // #1c1c25
  ACCENT:       [240, 192, 96],   // #f0c060
  TEXT_PRIMARY: [240, 237, 232],  // #f0ede8
  TEXT_SECONDARY:[138, 133, 153], // #8a8599
  TEXT_MUTED:   [78,  76,  90],   // #4e4c5a
  BORDER:       [30,  30,  40],   // subtle border
  GREEN:        [74,  222, 128],
  YELLOW:       [250, 204, 21],
  RED:          [248, 113, 113],
}

const ENERGY_COLOR = {
  green:  C.GREEN,
  yellow: C.YELLOW,
  red:    C.RED,
}

const ENERGY_LABEL = {
  green:  'High energy',
  yellow: 'Medium energy',
  red:    'Low energy',
}

// ─── Helpers ─────────────────────────────────────────────────

function rgb(color) {
  return { r: color[0], g: color[1], b: color[2] }
}

function setFill(doc, color) {
  doc.setFillColor(...color)
}

function setTextColor(doc, color) {
  doc.setTextColor(...color)
}

function setDrawColor(doc, color) {
  doc.setDrawColor(...color)
}

function formatDateLong(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

/**
 * Wraps text to fit within maxWidth and returns lines array.
 * jsPDF's built-in splitTextToSize handles this well.
 */
function wrappedLines(doc, text, maxWidth) {
  if (!text || !text.trim()) return []
  return doc.splitTextToSize(text.trim(), maxWidth)
}

/**
 * Draws a section block: label + body text, with a left accent bar.
 * Returns the new Y cursor position after the block.
 */
function drawSection(doc, label, content, y, pageH, margin, contentW) {
  if (!content || !content.trim()) return y

  const LABEL_H   = 5
  const LINE_H    = 5.5
  const PAD_V     = 10
  const BAR_W     = 3
  const INNER_W   = contentW - BAR_W - 8

  const lines = wrappedLines(doc, content, INNER_W)
  const blockH = PAD_V + LABEL_H + 4 + lines.length * LINE_H + PAD_V

  // Page break check
  if (y + blockH > pageH - margin - 10) {
    doc.addPage()
    y = margin + 10
  }

  // Section background
  setFill(doc, C.BG_SECTION)
  doc.roundedRect(margin, y, contentW, blockH, 3, 3, 'F')

  // Accent bar
  setFill(doc, C.ACCENT)
  doc.roundedRect(margin, y, BAR_W, blockH, 1.5, 1.5, 'F')

  // Label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  setTextColor(doc, C.TEXT_MUTED)
  doc.text(label.toUpperCase(), margin + BAR_W + 8, y + PAD_V)

  // Content text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setTextColor(doc, C.TEXT_PRIMARY)
  lines.forEach((line, i) => {
    doc.text(line, margin + BAR_W + 8, y + PAD_V + LABEL_H + 4 + i * LINE_H)
  })

  return y + blockH + 5
}

// ─── Main export ─────────────────────────────────────────────

/**
 * Generates and downloads a polished PDF for a single log entry.
 *
 * @param {object} entry   - The entry row from Supabase
 * @param {object} profile - The user's profile from Supabase
 */
export function generatePDF(entry, profile) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const { PAGE_W, PAGE_H, MARGIN, CONTENT_W } = C
  let y = MARGIN

  // ── Full-page dark background ──
  setFill(doc, C.BG)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  // ── Header bar ──
  const HEADER_H = 42
  setFill(doc, C.BG_SECTION)
  doc.rect(0, 0, PAGE_W, HEADER_H, 'F')

  // Accent top strip
  setFill(doc, C.ACCENT)
  doc.rect(0, 0, PAGE_W, 2.5, 'F')

  // Logbook name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  setTextColor(doc, C.ACCENT)
  doc.text(profile.logbook_name, MARGIN, 16)

  // Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setTextColor(doc, C.TEXT_SECONDARY)
  doc.text(formatDateLong(entry.date), MARGIN, 24)

  // Divider
  setDrawColor(doc, C.BORDER)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, 29, PAGE_W - MARGIN, 29)

  // Meta row: org · hours · energy
  const energyColor = ENERGY_COLOR[entry.energy]
  const energyLabel = ENERGY_LABEL[entry.energy]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  // Organization
  setTextColor(doc, C.TEXT_MUTED)
  doc.text(profile.organization, MARGIN, 36)

  // Hours pill
  const orgW  = doc.getTextWidth(profile.organization)
  const SEP   = 8
  setTextColor(doc, C.TEXT_SECONDARY)
  doc.text('·', MARGIN + orgW + SEP / 2, 36)
  doc.text(`${entry.hours}h`, MARGIN + orgW + SEP + 4, 36)

  // Energy dot + label
  const hoursW = doc.getTextWidth(`${entry.hours}h`)
  const dotX = MARGIN + orgW + SEP + 4 + hoursW + SEP
  setFill(doc, energyColor)
  doc.circle(dotX + 1.5, 34.5, 1.5, 'F')
  setTextColor(doc, energyColor)
  doc.text(energyLabel, dotX + 5, 36)

  // Location (right-aligned)
  setTextColor(doc, C.TEXT_MUTED)
  const locText = entry.location
  const locW = doc.getTextWidth(locText)
  doc.text(locText, PAGE_W - MARGIN - locW, 36)

  y = HEADER_H + 10

  // ── Content sections ──
  const SECTIONS = [
    { label: 'What I Worked On',     content: entry.worked_on },
    { label: 'What I Learned',       content: entry.learned   },
    { label: 'Blockers & Challenges',content: entry.blockers  },
    { label: 'Ideas & Notes',        content: entry.ideas     },
    { label: "Tomorrow's Plan",      content: entry.tomorrow  },
  ]

  for (const section of SECTIONS) {
    y = drawSection(doc, section.label, section.content, y, PAGE_H, MARGIN, CONTENT_W)
  }

  // ── Footer ──
  const footerY = PAGE_H - 14
  setDrawColor(doc, C.BORDER)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, footerY - 4, PAGE_W - MARGIN, footerY - 4)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  setTextColor(doc, C.TEXT_MUTED)
  doc.text(`— ${profile.name}`, MARGIN, footerY)

  // Page number (right)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const pageLabel = `${profile.logbook_name} · ${entry.date}`
  const pageLabelW = doc.getTextWidth(pageLabel)
  doc.text(pageLabel, PAGE_W - MARGIN - pageLabelW, footerY)

  // ── Save ──
  const safeName = profile.logbook_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const filename = `${safeName}-${entry.date}.pdf`
  doc.save(filename)
}
