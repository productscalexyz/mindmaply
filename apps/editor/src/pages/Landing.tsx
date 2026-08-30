import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { render } from 'mindmaply-core'
import { highlight } from '../highlight'
import { buildEmbedUrl } from '../share'
import { CHROME_EXTENSION_URL } from '../extension'

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
  D --> D2["Mind map out, instantly"]`

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

// The Chrome mark, drawn inline so the page pulls no external asset: three
// 120 degree wedges (red on top, yellow lower right, green lower left) under
// the white ring and blue core. Purely a signal of where the extension
// installs, next to text that always names Chrome.
function ChromeMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 24 L13 4.95 A 22 22 0 0 1 46 24 Z" />
      <path fill="#FBBC05" d="M24 24 L46 24 A 22 22 0 0 1 13 43.05 Z" />
      <path fill="#34A853" d="M24 24 L13 43.05 A 22 22 0 0 1 13 4.95 Z" />
      <circle cx="24" cy="24" r="12" fill="#fff" />
      <circle cx="24" cy="24" r="9.5" fill="#4285F4" />
    </svg>
  )
}

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="9" cy="16" r="4.4" stroke="var(--brand)" strokeWidth="2.2" />
        <g stroke="var(--brand)" strokeWidth="1.9" strokeLinecap="round">
          <path d="M13.4 16 C18.5 16 17.5 7.5 22.8 7.5" />
          <path d="M13.4 16 C17.5 16 18.5 16 23.2 16" />
          <path d="M13.4 16 C18.5 16 17.5 24.5 22.8 24.5" />
        </g>
        <circle cx="25.3" cy="7.5" r="2.1" fill="var(--brand)" />
        <circle cx="25.6" cy="16" r="2.1" fill="var(--brand)" />
        <circle cx="25.3" cy="24.5" r="2.1" fill="var(--brand)" />
      </svg>
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
        <h1>Text to beautiful mindmaps.</h1>
        <p>
          Write Markdown or Mermaid. Get presentation-quality mindmaps, org charts,
          and flowcharts in an instant, with zero dragging or aligning.
        </p>
        <div className="landing-hero-ctas">
          <Link to="/editor" className="landing-cta">Open Editor →</Link>
          <a
            href={CHROME_EXTENSION_URL}
            className="landing-cta landing-cta-ghost landing-cta-icon"
            target="_blank"
            rel="noreferrer"
          >
            <ChromeMark />
            Get the Chrome extension
          </a>
        </div>
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
        <h2>Why mind maps as code beat drag-and-drop</h2>
        <p className="landing-trio-intro">
          Mind maps as code, mind maps as text: a few lines of Markdown or Mermaid.js,
          zero dragging, aligning, or design decisions.
        </p>
        <div className="landing-trio-grid">
          <div className="landing-trio-card">
            <h3><span className="landing-trio-dot" style={{ background: 'var(--b1)' }} />Write text, not drag boxes</h3>
            <p>
              The same text always produces the same mind map. No arranging shapes,
              and AI assistants can write your mind maps for you.
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
            <h3><span className="landing-trio-dot" style={{ background: 'var(--b3)' }} />Two dialects, one mind map</h3>
            <p>
              Write a Markdown outline or standard Mermaid.js. Mindmaply renders
              both and converts between them.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-anywhere">
        <h2>Your mind map, anywhere</h2>
        <div className="landing-anywhere-grid">
          <div className="landing-anywhere-item">
            <h3>Export</h3>
            <p>Crisp SVG, or PNG up to 3× resolution, on a transparent or white background.</p>
          </div>
          <div className="landing-anywhere-item">
            <h3>Share</h3>
            <p>The whole mind map is encoded in the link. No account, no server.</p>
          </div>
          <div className="landing-anywhere-item">
            <h3>Embed</h3>
            <p>Drop an interactive iframe into any page. The demo above is one.</p>
          </div>
          <div className="landing-anywhere-item">
            <h3 className="landing-ext-h3">
              <ChromeMark size={17} />
              Chrome extension
            </h3>
            <p>
              Turn any YouTube video into a mind map, straight from the player.{' '}
              <a href={CHROME_EXTENSION_URL} className="docs-link" target="_blank" rel="noreferrer">
                Add it to Chrome →
              </a>
            </p>
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

      <section className="landing-yt">
        <h2>From YouTube video to mind map, one click</h2>
        <p className="landing-yt-intro">
          The Mindmaply Chrome extension adds a button to the YouTube player.
          Click it, and the whole talk becomes a shareable mind map: every story,
          argument and example as readable branches, in the language of the video.
        </p>
        <div className="landing-anywhere-shots">
          <figure>
            <img
              src="/landing/youtube-button.jpg"
              alt="The Mindmaply button in the YouTube player controls"
              loading="lazy"
            />
            <figcaption>One button in the player, no copy-pasting</figcaption>
          </figure>
          <figure>
            <img
              src="/landing/youtube-map.png"
              alt="A generated mind map of a TED talk with readable branches"
              loading="lazy"
            />
            <figcaption>The same talk, mapped and shareable</figcaption>
          </figure>
        </div>
        <a
          href={CHROME_EXTENSION_URL}
          className="landing-cta landing-yt-cta landing-cta-icon"
          target="_blank"
          rel="noreferrer"
        >
          <ChromeMark size={19} />
          Get the Chrome extension →
        </a>
      </section>

      <section className="landing-oss">
        <h2>Free and open source, all the way down</h2>
        <p>
          Mindmaply is free to use and MIT-licensed: no accounts, no paywalls, no premium tier.
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
          <a href="/privacy/" className="docs-link">Privacy</a>
        </div>
      </footer>
    </div>
  )
}
