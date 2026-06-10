import { useState } from 'react'
import { Link } from 'react-router-dom'
import { highlight } from '../highlight'
import { COLOR_SWATCHES, NAV_SECTIONS, SNIPPETS } from '../docs-content'

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
              mindmaply renders standard Mermaid <code>flowchart</code> syntax with an
              opinionated visual layer. You write Mermaid — we apply the styling.
              For the complete syntax reference, see the{' '}
              <a
                className="docs-link"
                href="https://mermaid.js.org/syntax/flowchart.html"
                target="_blank"
                rel="noreferrer"
              >
                Mermaid flowchart docs ↗
              </a>.
            </p>
          </section>

          {/* ── Layouts ── */}
          <section className="docs-section" id="layouts">
            <h2 className="docs-h2">Edge Styles</h2>
            <p className="docs-p">
              Edge rendering is independent of the diagram type. Set it in the
              document config (see <a className="docs-link" href="#config" onClick={e => { e.preventDefault(); navTo('config') }}>Config &amp; Themes</a>)
              or pass <code>edgeStyle</code> as an option to{' '}
              <code>{'render(source, { edgeStyle })'}</code>.
            </p>
            <div className="docs-code-label">straight — right-angle edges, best for org charts and process flows</div>
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{ __html: highlight(SNIPPETS.orthogonal) }} />
            </div>
            <div className="docs-code-label">curved — smooth bezier edges, best for mind maps</div>
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{ __html: highlight(SNIPPETS.curved) }} />
            </div>
          </section>

          {/* ── Color Palette ── */}
          <section className="docs-section" id="colors">
            <h2 className="docs-h2">Color Palette</h2>
            <p className="docs-p">
              Six classes make up the mindmaply palette. Apply them with{' '}
              <code>classDef</code> and <code>class</code> (or <code>:::shorthand</code>)
              in your flowchart source.
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
            <div className="docs-code-label">copy-paste classDef strings</div>
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{
                __html: highlight(COLOR_SWATCHES.map(s => s.classDef).join('\n'))
              }} />
            </div>
            <div className="docs-note">
              Branch nodes use 8% opacity fill (<code>#hex33</code>) with a full-opacity stroke.
              The root node is white with a dark border.
            </div>
          </section>

          {/* ── Shapes ── */}
          <section className="docs-section" id="shapes">
            <h2 className="docs-h2">Shapes</h2>
            <p className="docs-p">Node shapes that render well in mindmaply's visual style:</p>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Shape</th>
                  <th>Syntax</th>
                  <th>Use for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rectangle</td>
                  <td><code>A[Label]</code></td>
                  <td>Standard nodes</td>
                </tr>
                <tr>
                  <td>Rounded</td>
                  <td><code>A(Label)</code></td>
                  <td>Process steps</td>
                </tr>
                <tr>
                  <td>Circle</td>
                  <td><code>A((Label))</code></td>
                  <td>Root / hub nodes</td>
                </tr>
                <tr>
                  <td>Diamond</td>
                  <td><code>{'{'}Label{'}'}</code></td>
                  <td>Decisions</td>
                </tr>
                <tr>
                  <td>Stadium</td>
                  <td><code>A([Label])</code></td>
                  <td>Terminals / start-end</td>
                </tr>
              </tbody>
            </table>
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{ __html: highlight(SNIPPETS.shapes) }} />
            </div>
          </section>

          {/* ── Direction ── */}
          <section className="docs-section" id="direction">
            <h2 className="docs-h2">Direction</h2>
            <p className="docs-p">
              Set direction inline in your source string: <code>flowchart TD</code> (top-down)
              or <code>flowchart LR</code> (left-right). Both work with the{' '}
              <code>orthogonal</code> layout. The <code>curved</code> layout is optimised for{' '}
              <code>LR</code>.
            </p>
            <div className="docs-code-label">TD — top-down</div>
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{ __html: highlight(SNIPPETS.directionTD) }} />
            </div>
            <div className="docs-code-label">LR — left-right</div>
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{ __html: highlight(SNIPPETS.directionLR) }} />
            </div>
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
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{ __html: highlight(SNIPPETS.mindmap) }} />
            </div>
            <div className="docs-note">
              Mindmap sources default to curved edges, left-to-right. Both are configurable —
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
            <div className="docs-code-label">Mermaid — init directive (flowchart and mindmap)</div>
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{ __html: highlight(SNIPPETS.initConfig) }} />
            </div>
            <div className="docs-code-label">Markdown — frontmatter block</div>
            <div className="docs-code-block">
              <pre dangerouslySetInnerHTML={{ __html: highlight(SNIPPETS.frontmatterConfig, 'markdown') }} />
            </div>
            <div className="docs-note">
              Theme keys: <code>palette</code> (branch colors, cycled across top-level
              branches), <code>fontFamily</code>, <code>fontSize</code>, <code>textColor</code>,{' '}
              <code>canvasBg</code>, <code>rootBg</code>, <code>edgeStrokeWidth</code>. Omitted
              keys keep the default look. Invalid values are ignored — config never breaks a
              diagram.
            </div>
          </section>

          {/* ── Reference ── */}
          <section className="docs-section" id="reference">
            <h2 className="docs-h2">Full Reference</h2>
            <p className="docs-p">
              mindmaply supports the Mermaid <code>flowchart</code> diagram type.
              For complete node syntax, subgraphs, link styles, and more:
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
            </p>
          </section>

        </main>
      </div>
    </div>
  )
}
