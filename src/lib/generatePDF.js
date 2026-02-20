import { jsPDF } from 'jspdf'
import { formatDuration } from './timeUtils'

// ─── Design constants ─────────────────────────────────────────

const C = {
  PAGE_W: 210,
  PAGE_H: 297,
  MARGIN: 20,
  CONTENT_W: 170,
  BG:            [15,  15,  19],
  BG_SECTION:    [28,  28,  37],
  ACCENT:        [240, 192, 96],
  TEXT_PRIMARY:  [240, 237, 232],
  TEXT_SECONDARY:[138, 133, 153],
  TEXT_MUTED:    [78,  76,  90],
  BORDER:        [30,  30,  40],
  GREEN:         [74,  222, 128],
  YELLOW:        [250, 204, 21],
  RED:           [248, 113, 113],
}

const ENERGY_COLOR = { green: C.GREEN, yellow: C.YELLOW, red: C.RED }
const ENERGY_LABEL = { green: 'High energy', yellow: 'Medium energy', red: 'Low energy' }

// ─── Helpers ─────────────────────────────────────────────────

function setFill(doc, color)  { doc.setFillColor(...color) }
function setTextColor(doc, c) { doc.setTextColor(...c) }
function setDrawColor(doc, c) { doc.setDrawColor(...c) }

function formatDateLong(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function wrappedLines(doc, text, maxWidth) {
  if (!text || !text.trim()) return []
  return doc.splitTextToSize(text.trim(), maxWidth)
}

function drawSection(doc, label, content, y, pageH, margin, contentW) {
  if (!content || !content.trim()) return y
  const LABEL_H = 5, LINE_H = 5.5, PAD_V = 10, BAR_W = 3
  const INNER_W = contentW - BAR_W - 8
  const lines   = wrappedLines(doc, content, INNER_W)
  const blockH  = PAD_V + LABEL_H + 4 + lines.length * LINE_H + PAD_V
  if (y + blockH > pageH - margin - 10) { doc.addPage(); y = margin + 10 }
  setFill(doc, C.BG_SECTION)
  doc.roundedRect(margin, y, contentW, blockH, 3, 3, 'F')
  setFill(doc, C.ACCENT)
  doc.roundedRect(margin, y, BAR_W, blockH, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
  setTextColor(doc, C.TEXT_MUTED)
  doc.text(label.toUpperCase(), margin + BAR_W + 8, y + PAD_V)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  setTextColor(doc, C.TEXT_PRIMARY)
  lines.forEach((line, i) => {
    doc.text(line, margin + BAR_W + 8, y + PAD_V + LABEL_H + 4 + i * LINE_H)
  })
  return y + blockH + 5
}

// ─── Shared document builder ──────────────────────────────────

function buildDoc(entry, profile) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const { PAGE_W, PAGE_H, MARGIN, CONTENT_W } = C
  let y = MARGIN

  setFill(doc, C.BG)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  const HEADER_H = 42
  setFill(doc, C.BG_SECTION)
  doc.rect(0, 0, PAGE_W, HEADER_H, 'F')
  setFill(doc, C.ACCENT)
  doc.rect(0, 0, PAGE_W, 2.5, 'F')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
  setTextColor(doc, C.ACCENT)
  doc.text(profile.logbook_name, MARGIN, 16)

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  setTextColor(doc, C.TEXT_SECONDARY)
  doc.text(formatDateLong(entry.date), MARGIN, 24)

  setDrawColor(doc, C.BORDER); doc.setLineWidth(0.3)
  doc.line(MARGIN, 29, PAGE_W - MARGIN, 29)

  const energyColor = ENERGY_COLOR[entry.energy]
  const energyLabel = ENERGY_LABEL[entry.energy]
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  // Build meta line: org · time range · duration · energy ● · location
  const timeStr = (entry.start_time && entry.end_time)
    ? `${entry.start_time} – ${entry.end_time}  (${formatDuration(entry.hours)})`
    : `${entry.hours}h`

  setTextColor(doc, C.TEXT_MUTED)
  doc.text(profile.organization, MARGIN, 36)
  const orgW = doc.getTextWidth(profile.organization)
  const SEP = 7
  setTextColor(doc, C.TEXT_SECONDARY)
  doc.text('·', MARGIN + orgW + SEP / 2, 36)
  doc.text(timeStr, MARGIN + orgW + SEP + 3, 36)
  const timeW = doc.getTextWidth(timeStr)
  const dotX  = MARGIN + orgW + SEP + 3 + timeW + SEP
  setFill(doc, energyColor)
  doc.circle(dotX + 1.5, 34.5, 1.5, 'F')
  setTextColor(doc, energyColor)
  doc.text(energyLabel, dotX + 5, 36)
  setTextColor(doc, C.TEXT_MUTED)
  const locW = doc.getTextWidth(entry.location)
  doc.text(entry.location, PAGE_W - MARGIN - locW, 36)

  y = HEADER_H + 10

  const SECTIONS = [
    { label: 'What I Worked On',      content: entry.worked_on },
    { label: 'What I Learned',        content: entry.learned   },
    { label: 'Blockers & Challenges', content: entry.blockers  },
    { label: 'Ideas & Notes',         content: entry.ideas     },
    { label: "Tomorrow's Plan",       content: entry.tomorrow  },
  ]
  for (const s of SECTIONS) {
    y = drawSection(doc, s.label, s.content, y, PAGE_H, MARGIN, CONTENT_W)
  }

  const footerY = PAGE_H - 14
  setDrawColor(doc, C.BORDER); doc.setLineWidth(0.3)
  doc.line(MARGIN, footerY - 4, PAGE_W - MARGIN, footerY - 4)
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
  setTextColor(doc, C.TEXT_MUTED)
  doc.text(`— ${profile.name}`, MARGIN, footerY)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  const pageLabel  = `${profile.logbook_name} · ${entry.date}`
  const pageLabelW = doc.getTextWidth(pageLabel)
  doc.text(pageLabel, PAGE_W - MARGIN - pageLabelW, footerY)

  return doc
}

// ─── Public exports ───────────────────────────────────────────

/** Generates the PDF filename for a given entry + profile. */
export function getPDFFilename(entry, profile) {
  const safeName = profile.logbook_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  return `${safeName}-${entry.date}.pdf`
}

/** Builds the PDF and triggers a browser download. */
export function generatePDF(entry, profile) {
  buildDoc(entry, profile).save(getPDFFilename(entry, profile))
}

/** Builds the PDF and returns it as a base64 string (for upload). */
export function generatePDFBase64(entry, profile) {
  return buildDoc(entry, profile).output('datauristring').split(',')[1]
}
