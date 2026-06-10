// Shared node-id generation for parsers whose syntax has no explicit ids
// (markdown headings/bullets, mermaid mindmap lines).
export function slugify(label: string, counter: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20) || 'node'
  return `${base}_${counter}`
}
