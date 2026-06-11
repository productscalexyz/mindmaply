import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { render, renderMarkdown } from 'mindmaply-core'
import { highlight } from '../highlight'
import { COLOR_SWATCHES, NAV_SECTIONS, SNIPPETS } from '../docs-content'

// A doc snippet rendered live by the real engine, embedded under its code
// block. Snippets are self-contained (config travels in the source), so what
// you see is exactly what that source produces.
function Example({ source, format = 'mermaid' }: { source: string; format?: 'mermaid' | 'markdown' }) {
  const svg = useMemo(() => {
    try {
      return format === 'markdown' ? renderMarkdown(source) : render(source)
    } catch {
      return ''
    }
  }, [source, format])
  if (!svg) return null
  return <div className="docs-example" dangerouslySetInnerHTML={{ __html: svg }} />
}

function Snippet({ source, format = 'mermaid', label }: { source: string; format?: 'mermaid' | 'markdown'; label?: string }) {
  return (
    <>
      {label && <div className="docs-code-label">{label}</div>}
      <div className="docs-code-block">
        <pre dangerouslySetInnerHTML={{ __html: highlight(source, format) }} />
      </div>
      <Example source={source} format={format} />
    </>
  )
}

export default function Docs() {
  const [active, setActive] = useState('overview')

  function navTo(id: string) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="docs-page">
      <header className="docs-topbar">
        <span className="docs-topbar-brand">mindmaply</span>
        <Link to="/editor" className="docs-topbar-action">
          Open Editor →
        </Link>
      </header>

      <div className="docs-body">
        <nav className="docs-nav">
          <div className="docs-nav-title">On this page</div>
          {NAV_SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`docs-nav-link${active === s.id ? ' active' : ''}`}
              onClick={e => { e.preventDefault(); navTo(s.id) }}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <main className="docs-content">

          {/* ── Overview ── */}
          <section className="docs-section" id="overview">
            <h1 className="docs-h1">Syntax Reference</h1>
            <p className="docs-tagline">
              mindmaply draws diagrams from text. Two languages are supported —
              Mermaid (<code>flowchart</code> and <code>mindmap</code> grammars) and
              Markdown outlines — and two diagram types: <strong>flowchart</strong> and{' '}
              <strong>mindmap</strong>. The language never decides the diagram type, and
              neither decides how it renders: direction, edge style, and theme are
              always configurable. Every example below is rendered live by the real
              engine — the drawing under each code block is exactly what that source
              produces.
            </p>
          </section>

          {/* ── Edge Styles ── */}
          <section className="docs-section" id="layouts">
            <h2 className="docs-h2">Edge Styles</h2>
            <p className="docs-p">
              Edge rendering is independent of the diagram type. Set it in the
              document config (see <a className="docs-link" href="#config" onClick={e => { e.preventDefault(); navTo('config') }}>Config &amp; Themes</a>)
              or pass <code>edgeStyle</code> as an option to{' '}
              <code>{'render(source, { edgeStyle })'}</code>.
            </p>
            <Snippet
              source={SNIPPETS.straight}
              label="straight — right-angle elbows (flowchart default)"
            />
            <Snippet
              source={SNIPPETS.curved}
              label="curved — smooth bezier arcs (mindmap default), here opted into via the init directive"
            />
          </section>

          {/* ── Colors ── */}
          <section className="docs-section" id="colors">
            <h2 className="docs-h2">Colors</h2>
            <p className="docs-p">
              Branch colors are automatic: each top-level branch takes the next color
              from the palette, and its whole subtree inherits it. The root stays white.
            </p>
            <div className="docs-swatches">
              {COLOR_SWATCHES.map(s => (
                <div key={s.id} className="docs-swatch">
                  <div
                    className="docs-swatch-circle"
                    style={{
                      background: s.hex,
                      borderColor: s.id === 'root' ? '#1E293B' : s.hex,
                    }}
                  />
                  <div className="docs-swatch-label">{s.label}</div>
                  <div className="docs-swatch-hex">{s.hex}</div>
                </div>
              ))}
            </div>
            <p className="docs-p">
              Override individual nodes with <code>style</code> directives
              (flowchart syntax), or replace the whole palette via the theme
              (see <a className="docs-link" href="#config" onClick={e => { e.preventDefault(); navTo('config') }}>Config &amp; Themes</a>).
            </p>
            <Snippet
              source={SNIPPETS.styleOverride}
              label="per-node overrides — outlined and dashed variants"
            />
          </section>

          {/* ── Shapes ── */}
          <section className="docs-section" id="shapes">
            <h2 className="docs-h2">Shapes</h2>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Shape</th>
                  <th>Flowchart syntax</th>
                  <th>Mindmap syntax</th>
                  <th>Use for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rectangle</td>
                  <td><code>A[Label]</code> / <code>A["Label"]</code></td>
                  <td><code>[Label]</code> or bare text</td>
                  <td>Standard nodes</td>
                </tr>
                <tr>
                  <td>Rounded</td>
                  <td>—</td>
                  <td><code>(Label)</code></td>
                  <td>Soft emphasis</td>
                </tr>
                <tr>
                  <td>Circle</td>
                  <td><code>A((Label))</code></td>
                  <td><code>((Label))</code></td>
                  <td>Root / hub nodes</td>
                </tr>
              </tbody>
            </table>
            <div className="docs-note">
              Other mermaid shapes (diamond, stadium, hexagon, cloud) parse gracefully
              and render as rectangles for now.
            </div>
            <Snippet source={SNIPPETS.shapes} />
          </section>

          {/* ── Direction ── */}
          <section className="docs-section" id="direction">
            <h2 className="docs-h2">Direction</h2>
            <p className="docs-p">
              Both diagram types flow top-down (<code>TD</code>) or left-right
              (<code>LR</code>), with either edge style. Flowcharts declare it in the
              header; mindmap blocks and markdown use the document config or render
              options.
            </p>
            <Snippet source={SNIPPETS.directionTD} label="TD — top-down" />
            <Snippet source={SNIPPETS.directionLR} label="LR — left-right" />
          </section>

          {/* ── Mindmap Syntax ── */}
          <section className="docs-section" id="mindmap">
            <h2 className="docs-h2">Mindmap Syntax</h2>
            <p className="docs-p">
              Standard Mermaid <code>mindmap</code> blocks are supported alongside flowcharts.
              Nesting is indentation-based and relative — each line becomes a child of the
              nearest line above it with smaller indentation. <code>::icon(...)</code> directives
              are accepted (icons are not rendered yet), and <code>&lt;br/&gt;</code> inside a
              label produces a line break.
            </p>
            <Snippet source={SNIPPETS.mindmap} />
            <div className="docs-note">
              Mindmaps default to curved edges, left-to-right. Both are configurable —
              the diagram type never dictates how it renders.
            </div>
          </section>

          {/* ── Config & Themes ── */}
          <section className="docs-section" id="config">
            <h2 className="docs-h2">Config &amp; Themes</h2>
            <p className="docs-p">
              Direction, edge style, and theme (palette, fonts, colors) travel with the
              document, so a shared or embedded diagram keeps its look. Render options
              passed to <code>render()</code> win over document config, which wins over
              format defaults.
            </p>
            <Snippet
              source={SNIPPETS.initConfig}
              label="Mermaid — init directive (flowchart and mindmap)"
            />
            <Snippet
              source={SNIPPETS.frontmatterConfig}
              format="markdown"
              label="Markdown — frontmatter block"
            />
            <div className="docs-note">
              Theme keys: <code>palette</code> (branch colors, cycled across top-level
              branches), <code>fontFamily</code>, <code>fontSize</code>, <code>textColor</code>,{' '}
              <code>canvasBg</code>, <code>rootBg</code>, <code>edgeStrokeWidth</code>,{' '}
              <code>wrapWidth</code>, <code>typography</code>, <code>nodeStyle</code>,{' '}
              <code>nodeBg</code>. Omitted
              keys keep the default look. Invalid values are ignored — config never breaks a
              diagram.
            </div>
            <div className="docs-note">
              Long labels auto-wrap at 260px (<code>theme.wrapWidth</code> in px,{' '}
              <code>0</code> disables) — explicit <code>&lt;br/&gt;</code> breaks still apply.
              Deeper levels render progressively smaller for hierarchy
              (<code>theme.typography: uniform</code> keeps one size everywhere).
              Non-root nodes draw the same card surface as the root with a{' '}
              <code>theme.nodeBg</code> fill; <code>theme.nodeStyle: plain</code> renders
              bare text.
            </div>
            <div className="docs-note">
              There is no link between language and diagram type. In mermaid the grammar
              declares the type (<code>flowchart</code> header vs <code>mindmap</code> block);
              in markdown it is the <code>diagram:</code> frontmatter key
              (<code>flowchart</code> or <code>mindmap</code>, default <code>mindmap</code>).
              Switching languages keeps the type — a flowchart stays a flowchart in markdown
              and converts back to flowchart grammar.
            </div>
          </section>

          {/* ── Reference ── */}
          <section className="docs-section" id="reference">
            <h2 className="docs-h2">Full Reference</h2>
            <p className="docs-p">
              mindmaply supports the Mermaid <code>flowchart</code> and{' '}
              <code>mindmap</code> diagram types. For the upstream syntax references:
            </p>
            <p className="docs-p">
              <a
                className="docs-link"
                href="https://mermaid.js.org/syntax/flowchart.html"
                target="_blank"
                rel="noreferrer"
              >
                mermaid.js.org/syntax/flowchart.html ↗
              </a>
              <br />
              <a
                className="docs-link"
                href="https://mermaid.js.org/syntax/mindmap.html"
                target="_blank"
                rel="noreferrer"
              >
                mermaid.js.org/syntax/mindmap.html ↗
              </a>
            </p>
          </section>

        </main>
      </div>
    </div>
  )
}
