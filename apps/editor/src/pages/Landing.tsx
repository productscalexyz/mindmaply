import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { render } from 'mindmaply-core'
import { highlight } from '../highlight'
import { buildEmbedUrl } from '../share'

// The hero demo's content IS the value story — rendered live by mindmaply-core.
const DEMO_SOURCE = `flowchart LR
  root["Mindmaply"]
  root --> A["AI-native"]
  root --> B["Beautiful by default"]
  root --> C["No lock-in"]
  root --> D["Instant"]
  A --> A1["Plain Mermaid text in"]
  A --> A2["Perfect for AI agents"]
  B --> B1["Auto-colored branches"]
  B --> B2["Curated palette"]
  C --> C1["Valid Mermaid anywhere"]
  C --> C2["Share with just a URL"]
  D --> D1["No dragging, no aligning"]
  D --> D2["Diagram out, instantly"]`

// The roadmap is itself a mindmaply diagram, rendered by the engine.
const ROADMAP_SOURCE = `flowchart LR
  Today["Today"]
  Today --> MM["Mind Map"]
  Today --> OC["Org Chart"]
  Today --> Next["Next"]
  Next --> Py["Pyramid"]
  Next --> Fl["Flowchart"]
  Next --> Later["Later"]
  Later --> SW["Swimlanes"]
  Later --> UML["UML Sequence"]
  Later --> More["...and more"]`

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }} />
      <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.4px' }}>mindmaply</span>
    </div>
  )
}

export default function Landing() {
  // Safe for dangerouslySetInnerHTML: both strings derive from the static
  // DEMO_SOURCE constant — highlight() HTML-escapes its input and render()
  // emits our own SVG. No user input flows in.
  const highlighted = useMemo(() => highlight(DEMO_SOURCE, 'mermaid'), [])
  // The demo canvas is the real embed view in an iframe — the same snippet the
  // Share modal hands out, so the demo doubles as proof of the embed feature.
  const embedSrc = useMemo(
    () => buildEmbedUrl({ v: 1, source: DEMO_SOURCE, format: 'mermaid', direction: 'LR' }),
    [],
  )
  const roadmapSvg = useMemo(() => {
    try {
      return render(ROADMAP_SOURCE, { layout: 'orthogonal' })
    } catch (err) {
      console.error('mindmaply-core render error:', err)
      return ''
    }
  }, [])

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <Brand />
        <div className="landing-nav-links">
          <Link to="/docs" className="docs-link">Docs</Link>
          <a href="https://github.com/productscalexyz/mindmaply" className="docs-link" target="_blank" rel="noreferrer">GitHub</a>
          <Link to="/editor" className="landing-cta landing-cta-sm">Open Editor</Link>
        </div>
      </nav>

      <header className="landing-hero">
        <a
          href="https://github.com/productscalexyz/mindmaply"
          className="landing-badge"
          target="_blank"
          rel="noreferrer"
        >
          Free &amp; open source · MIT License
        </a>
        <h1>Text to beautiful diagrams.</h1>
        <p>
          Write Markdown or Mermaid. Get presentation-quality mind maps, org charts,
          and flowcharts in an instant, with zero dragging or aligning.
        </p>
        <Link to="/editor" className="landing-cta">Open Editor →</Link>
      </header>

      <section className="landing-demo landing-demo-tight">
        <div className="landing-demo-code">
          <div className="landing-demo-bar">
            <div className="tl"><span className="tl-r" /><span className="tl-y" /><span className="tl-g" /></div>
            <span className="t-filename">mindmap.mmd</span>
          </div>
          <pre dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
        <div className="landing-demo-canvas has-embed">
          <iframe
            className="landing-demo-embed"
            src={embedSrc}
            title="Live Mindmaply embed"
            loading="lazy"
          />
        </div>
      </section>
      <p className="landing-demo-caption">
        This is a live, interactive embed. Pan and zoom it, or drop the same iframe into any page.
      </p>

      <section className="landing-trio">
        <h2>Why diagrams as code beats drag-and-drop</h2>
        <p className="landing-trio-intro">
          Diagrams as code, diagrams as text: a few lines of Markdown or Mermaid.js,
          zero dragging, aligning, or design decisions.
        </p>
        <div className="landing-trio-grid">
          <div className="landing-trio-card">
            <h3><span className="landing-trio-dot" style={{ background: 'var(--b1)' }} />Write text, not drag boxes</h3>
            <p>
              The same text always produces the same diagram. No arranging shapes,
              and AI assistants can write your diagrams for you.
            </p>
          </div>
          <div className="landing-trio-card">
            <h3><span className="landing-trio-dot" style={{ background: 'var(--b2)' }} />Beautiful by default, not by effort</h3>
            <p>
              Auto-colored branches, a curated palette, and smart layouts.
              Every design decision is already made.
            </p>
          </div>
          <div className="landing-trio-card">
            <h3><span className="landing-trio-dot" style={{ background: 'var(--b3)' }} />Two dialects, one diagram</h3>
            <p>
              Write a Markdown outline or standard Mermaid.js. Mindmaply renders
              both and converts between them.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-anywhere">
        <h2>Your diagram, anywhere</h2>
        <div className="landing-anywhere-grid">
          <div className="landing-anywhere-item">
            <h3>Export</h3>
            <p>Crisp SVG, or PNG up to 3× resolution, on a transparent or white background.</p>
          </div>
          <div className="landing-anywhere-item">
            <h3>Share</h3>
            <p>The whole diagram is encoded in the link. No account, no server.</p>
          </div>
          <div className="landing-anywhere-item">
            <h3>Embed</h3>
            <p>Drop an interactive iframe into any page. The demo above is one.</p>
          </div>
        </div>
        <div className="landing-anywhere-shots">
          <figure>
            <img
              src="/landing/export-modal.png"
              alt="Mindmaply export dialog with SVG, PNG up to 3x resolution, and source text options"
              loading="lazy"
            />
            <figcaption>Export, straight from the editor</figcaption>
          </figure>
          <figure>
            <img
              src="/landing/share-modal.png"
              alt="Mindmaply share dialog with a view-and-edit link and an interactive iframe embed snippet"
              loading="lazy"
            />
            <figcaption>Share a link or copy the iframe</figcaption>
          </figure>
        </div>
      </section>

      <section className="landing-oss">
        <h2>Free and open source, all the way down</h2>
        <p>
          Mindmaply is free to use and MIT-licensed — no accounts, no paywalls, no premium tier.
          At its heart is <code>mindmaply-core</code>, a pure-function engine that turns Markdown
          or Mermaid.js into presentation-quality SVG. No DOM, no canvas, no closed ecosystem: it
          runs in the browser, in Node, in your CI, or inside an AI pipeline. The editor you see
          above is just one consumer of it.
        </p>
        <a href="https://github.com/productscalexyz/mindmaply" className="landing-gh" target="_blank" rel="noreferrer">
          Star us on GitHub →
        </a>
      </section>

      <section className="landing-roadmap">
        <h2>More diagram types on the way</h2>
        <div className="landing-roadmap-canvas">
          {roadmapSvg
            ? <div className="landing-demo-svg" dangerouslySetInnerHTML={{ __html: roadmapSvg }} />
            : <span className="landing-demo-empty">roadmap preview</span>}
        </div>
        <p className="landing-roadmap-caption">Naturally, this roadmap is rendered by <code>mindmaply-core</code> too.</p>
      </section>

      <footer className="landing-footer">
        <Brand />
        <div className="landing-nav-links">
          <Link to="/editor" className="docs-link">Editor</Link>
          <Link to="/docs" className="docs-link">Docs</Link>
          <a href="https://github.com/productscalexyz/mindmaply" className="docs-link" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://github.com/productscalexyz/mindmaply/blob/main/LICENSE" className="docs-link" target="_blank" rel="noreferrer">MIT License</a>
        </div>
      </footer>
    </div>
  )
}
