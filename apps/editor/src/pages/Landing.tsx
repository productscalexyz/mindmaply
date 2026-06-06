import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { render } from 'mindmaply-core'
import { highlight } from '../highlight'

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
  C --> C2["Version-control friendly"]
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
  const svg = useMemo(() => {
    try {
      return render(DEMO_SOURCE, { layout: 'curved' })
    } catch (err) {
      console.error('mindmaply-core render error:', err)
      return ''
    }
  }, [])
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
          <Link to="/editor" className="landing-cta landing-cta-sm">Open Editor</Link>
        </div>
      </nav>

      <header className="landing-hero">
        <h1>Beautiful diagrams,<br />instantly.</h1>
        <p>Markdown or Mermaid to diagrams, instantly.</p>
        <Link to="/editor" className="landing-cta">Open Editor →</Link>
      </header>

      <section className="landing-demo">
        <div className="landing-demo-code">
          <div className="landing-demo-bar">
            <div className="tl"><span className="tl-r" /><span className="tl-y" /><span className="tl-g" /></div>
            <span className="t-filename">mindmap.mmd</span>
          </div>
          <pre dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
        <div className="landing-demo-canvas">
          {svg
            ? <div className="landing-demo-svg" dangerouslySetInnerHTML={{ __html: svg }} />
            : <span className="landing-demo-empty">diagram preview</span>}
        </div>
      </section>

      <section className="landing-why">
        <h2>Why we built it</h2>
        <ul>
          <li><span className="landing-why-dot" style={{ background: 'var(--b1)' }} />AI assistants and engineers write diagrams as text, but text-first tools render them poorly.</li>
          <li><span className="landing-why-dot" style={{ background: 'var(--b2)' }} />Beautiful tools mean dragging, aligning, and closed ecosystems. Painful for programmatic workflows.</li>
          <li><span className="landing-why-dot" style={{ background: 'var(--brand)' }} />Mindmaply closes the gap: plain text in, presentation-quality diagrams out. No design decisions to make.</li>
          <li><span className="landing-why-dot" style={{ background: 'var(--b3)' }} />Your source stays valid Markdown or Mermaid: readable, diffable, and portable forever.</li>
        </ul>
      </section>

      <section className="landing-oss">
        <h2>Open source, all the way down</h2>
        <p>
          Mindmaply brings open-source software to beautiful diagramming. At its heart is{' '}
          <code>mindmaply-core</code>, a pure-function engine that turns Markdown or Mermaid.js
          into presentation-quality SVG. No DOM, no canvas, no closed ecosystem: it runs in the
          browser, in Node, in your CI, or inside an AI pipeline. The editor you see above is just
          one consumer of it.
        </p>
      </section>

      <section className="landing-roadmap">
        <h2>Diagram roadmap</h2>
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
        </div>
      </footer>
    </div>
  )
}
