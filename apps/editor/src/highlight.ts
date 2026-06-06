/**
 * Converts a source string to syntax-highlighted HTML.
 * Mode 'mermaid' uses Mermaid flowchart token colors.
 * Mode 'markdown' uses heading and bullet marker colors.
 * Returns a string of <span class="..."> elements safe for dangerouslySetInnerHTML.
 */
export function highlight(source: string, mode: 'mermaid' | 'markdown' = 'mermaid'): string {
  return source
    .split('\n')
    .map(mode === 'markdown' ? highlightMarkdownLine : highlightLine)
    .join('\n')
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightMarkdownLine(raw: string): string {
  const headingMatch = raw.match(/^(#{1,6})(\s+)(.+)$/)
  if (headingMatch) {
    return (
      `<span class="md-h">${esc(headingMatch[1])}</span>` +
      headingMatch[2] +
      `<span class="md-ht">${esc(headingMatch[3])}</span>`
    )
  }

  const bulletMatch = raw.match(/^(\s*)([-*+])(\s+)(.+)$/)
  if (bulletMatch) {
    return (
      esc(bulletMatch[1]) +
      `<span class="md-b">${esc(bulletMatch[2])}</span>` +
      bulletMatch[3] +
      esc(bulletMatch[4])
    )
  }

  return esc(raw)
}

function highlightLine(raw: string): string {
  let line = esc(raw)

  // comments (lines starting with %%)
  if (/^\s*%%/.test(raw)) return `<span class="cmt">${line}</span>`

  // classDef lines
  if (/^\s*classDef/.test(raw)) {
    return line.replace(/(classDef\s+\w+)(\s+)(.*)/, (_, def, sp, rest) =>
      `<span class="cls">${def}</span>${sp}<span class="str">${rest}</span>`
    )
  }

  // class assignment lines
  if (/^\s*class\s/.test(raw)) {
    return line.replace(/(class\s+)(.*)/, (_, kw, rest) =>
      `<span class="dir">${kw}${rest}</span>`
    )
  }

  // node labels: "text" in quotes — must run FIRST, before any spans are
  // injected, or it matches the quotes inside class="..." attributes
  line = line.replace(/"([^"]+)"/g, `"<span class="str">$1</span>"`)

  // flowchart/graph keyword + direction
  line = line.replace(
    /^(\s*)(flowchart|graph)(\s+)(TD|LR|TB|RL)/,
    (_, indent, kw, sp, dir) =>
      `${indent}<span class="kw">${kw}</span>${sp}<span class="acc">${dir}</span>`
  )

  // arrows (already HTML-escaped as --&gt;)
  line = line.replace(/--&gt;(\|([^|]+)\|)?/g, (_, label, inner) =>
    inner
      ? `<span class="ar">--&gt;|</span><span class="str">${inner}</span><span class="ar">|</span>`
      : `<span class="ar">--&gt;</span>`
  )

  // node IDs before [ or ( or {
  line = line.replace(/\b([A-Za-z_][A-Za-z0-9_]*)(?=[\[({])/g, `<span class="nd">$1</span>`)

  return line
}
