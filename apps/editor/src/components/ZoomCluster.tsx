interface Props {
  zoom: number
  onChange: (z: number) => void
  /** Re-fit the diagram: scale it to fill the canvas and re-center it. */
  onFit: () => void
}

export default function ZoomCluster({ zoom, onChange, onFit }: Props) {
  const pct = `${Math.round(zoom * 100)}%`

  return (
    <div className="zoom-cluster">
      <button className="zc-btn" title="Zoom out (⌘-)" onClick={() => onChange(zoom - 0.15)}>
        −
      </button>
      <span className="zc-pct">{pct}</span>
      <button className="zc-btn" title="Zoom in (⌘+)" onClick={() => onChange(zoom + 0.15)}>
        +
      </button>
      <div className="zc-sep" />
      <button className="zc-fit" title="Fit mind map to view" onClick={onFit}>Fit</button>
      {/* presets are a desktop nicety; pinch covers this on touch (hidden via .zc-preset) */}
      <div className="zc-sep zc-preset" />
      <button className="zc-fit zc-preset" onClick={() => onChange(0.5)}>50%</button>
      <button
        className="zc-fit zc-preset"
        style={{ color: 'var(--brand)', fontWeight: 600 }}
        onClick={() => onChange(1)}
      >
        100%
      </button>
      <button className="zc-fit zc-preset" onClick={() => onChange(1.5)}>150%</button>
    </div>
  )
}
