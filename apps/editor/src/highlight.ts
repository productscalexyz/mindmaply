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

// One alternation, applied to the RAW line in a single pass. Sequential
// .replace() calls over already-highlighted HTML corrupt the markup (e.g.
// the quoted-label regex matching the "ar" class attribute of an injected
// arrow span), which desyncs the visible text from the textarea and breaks
// caret alignment. Tokenizing the raw string once keeps the rendered text
// char-for-char identical to the source.
const MERMAID_TOKEN_RE = /-->(\|[^|]*\|)?|"[^"]*"|[A-Za-z_][A-Za-z0-9_]*(?=[\[({])/g

function highlightLine(raw: string): string {
  // comments (lines starting with %%)
  if (/^\s*%%/.test(raw)) return `<span class="cmt">${esc(raw)}</span>`

  // classDef lines
  const classDefMatch = raw.match(/^(\s*)(classDef\s+\w+)(\s+)(.*)$/)
  if (classDefMatch) {
    return (
      classDefMatch[1] +
      `<span class="cls">${esc(classDefMatch[2])}</span>` +
      classDefMatch[3] +
      `<span class="str">${esc(classDefMatch[4])}</span>`
    )
  }

  // class assignment lines
  const classMatch = raw.match(/^(\s*)(class\s.*)$/)
  if (classMatch) return classMatch[1] + `<span class="dir">${esc(classMatch[2])}</span>`

  // flowchart/graph keyword + direction
  const headerMatch = raw.match(/^(\s*)(flowchart|graph)(\s+)(TD|LR|TB|RL)(.*)$/)
  if (headerMatch) {
    return (
      headerMatch[1] +
      `<span class="kw">${headerMatch[2]}</span>` +
      headerMatch[3] +
      `<span class="acc">${headerMatch[4]}</span>` +
      esc(headerMatch[5])
    )
  }

  // node/edge lines: arrows, quoted labels, node IDs before [ ( {
  let out = ''
  let last = 0
  for (const m of raw.matchAll(MERMAID_TOKEN_RE)) {
    out += esc(raw.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('-->')) {
      if (m[1]) {
        out +=
          `<span class="ar">--&gt;|</span>` +
          `<span class="str">${esc(m[1].slice(1, -1))}</span>` +
          `<span class="ar">|</span>`
      } else {
        out += `<span class="ar">--&gt;</span>`
      }
    } else if (tok.startsWith('"')) {
      out += `"<span class="str">${esc(tok.slice(1, -1))}</span>"`
    } else {
      out += `<span class="nd">${esc(tok)}</span>`
    }
    last = m.index + tok.length
  }
  out += esc(raw.slice(last))
  return out
}
