import type { Theme } from '../config'
import { TYPE_SCALE } from '../design'

// Width factors by character class — a rough but stable SVG estimate that
// beats a flat 0.6em for labels heavy in narrow (il.,') or wide (mwMW) glyphs.
const NARROW_RE = /[iltfj.,;:'"!|()[\] ]/
const WIDE_RE = /[mwMW@%&]/

function charWidthFactor(ch: string): number {
  if (NARROW_RE.test(ch)) return 0.35
  if (WIDE_RE.test(ch)) return 0.9
  return 0.6
}

// Estimate text width for a single line of a label
export function estimateLineWidth(line: string, fontSize: number): number {
  let factor = 0
  for (const ch of line) factor += charWidthFactor(ch)
  return factor * fontSize
}

/**
 * Greedy word wrap of one hard line. maxWidth <= 0 disables (returns [line]).
 * A single word wider than maxWidth gets its own overflowing line — no
 * hyphenation. Lines that already fit are returned verbatim.
 */
export function wrapLine(line: string, maxWidth: number, fontSize: number): string[] {
  if (maxWidth <= 0 || estimateLineWidth(line, fontSize) <= maxWidth) return [line]
  const words = line.split(' ').filter(w => w.length > 0)
  if (words.length === 0) return [line]
  const out: string[] = []
  let current = words[0]
  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`
    if (estimateLineWidth(candidate, fontSize) <= maxWidth) {
      current = candidate
    } else {
      out.push(current)
      current = word
    }
  }
  out.push(current)
  return out
}

/**
 * Split a label into display lines: hard `\n` breaks (from <br/>) are
 * respected, and each segment soft-wraps independently at maxWidth. The
 * result is layout/render-only — never written back to the source.
 */
export function wrapLabel(label: string, maxWidth: number, fontSize: number): string[] {
  return label.split('\n').flatMap(seg => wrapLine(seg, maxWidth, fontSize))
}

/**
 * Per-depth font size — the single source of truth shared by layout
 * measurement and the SVG renderer so node boxes always match the glyphs.
 * Rounded to half-px steps to keep SVG output tidy.
 */
export function fontSizeForDepth(depth: number, theme: Theme): number {
  if (theme.typography === 'uniform') return theme.fontSize
  const scale = TYPE_SCALE[Math.min(depth, TYPE_SCALE.length - 1)]
  return Math.round(theme.fontSize * scale * 2) / 2
}
