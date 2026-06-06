# Future Phases — Mindmaply

A living doc for ideas and features deferred from current implementation phases.
Anyone (human or agent) can add to this doc. Group by feature area. Include a brief rationale and the phase/spec it was deferred from.

---

## Markdown Format (deferred from: 2026-04-17-markdown-format-design)

- **YAML frontmatter support** — allow layout and title config at the top of markdown files, e.g.:
  ```yaml
  ---
  title: My Diagram
  layout: curved
  ---
  ```
  Maps to `%%{init}%%` directive equivalent for markdown input.

- **Rich markmap-style node content** — support inline rich content inside nodes:
  - Tables (`| col | col |`)
  - Fenced code blocks (` ```js `)
  - KaTeX math (`$x = y$`)
  - Checkboxes (`- [x] done`)
  - Inline images (`![alt](url)`)
  - Links rendered as clickable node labels

- **Config tab in the editor** — a second tab alongside the code editor for diagram-level settings (layout, color palette, direction) as a structured form rather than inline syntax.

---

## Diagram Types (deferred from: 2026-04-15-mindmaply-design)

- **Flowchart diagram type** — shapes: pills for Start/End, rounded rects for Processes, diamonds for Decisions. Muted pastel fills, orthogonal routing with bezier elbows (12–16px radius).
- **Pyramid diagram type** — hierarchical triangle layout.
- **Swimlane diagrams**
- **UML sequence diagrams**
- **Org chart as first-class type** (currently rendered as flowchart)

---

## Editor Experience

- **Monaco / CodeMirror integration** — replace textarea+pre with a proper editor component for bracket matching, multi-cursor, find/replace.
- **Undo/redo stack** — diagram-level undo, not just browser text undo.
- **AI input** — natural language → Mermaid/Markdown via LLM. Lightning bolt button in toolbar.
- **Minimap** — small overview panel for large diagrams.

---

## Sharing & Export

- **PNG/SVG export** — download current diagram at 2x retina resolution.
- **Share links** — `mindmaply.app/d/{id}`, Mermaid/Markdown source stored server-side.
- **iframe embed** — `mindmaply.app/embed/{id}`, no chrome, fully responsive.
- **PowerPoint / Keynote export**

---

## Collaboration

- **Real-time collaborative editing**
- **Comments and threads on nodes**
- **Version history / named snapshots**

---

## Design System

- **User-configurable color palette** — override the default 5-color branch palette per diagram.
- **Custom fonts** — allow font selection beyond Inter/system-ui.
- **Dark mode canvas** — dark background variant of the canvas.
