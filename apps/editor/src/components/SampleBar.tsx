import { SAMPLES, type SampleId } from '../samples'
import { diagramType, DIAGRAM_TYPE_COLORS } from '../diagram-type'

const SAMPLE_IDS: SampleId[] = ['org', 'mm', 'proc', 'batman']

interface Props {
  active: SampleId
  onChange: (id: SampleId) => void
}

export default function SampleBar({ active, onChange }: Props) {
  return (
    <div className="sample-bar">
      <span className="sample-label">Sample</span>
      {SAMPLE_IDS.map((id) => {
        // Samples are stored in mermaid — color the chip by what gets drawn
        const type = diagramType(SAMPLES[id].sources.TD, 'mermaid')
        return (
          <button
            key={id}
            className={`samp-btn${active === id ? ' on' : ''}`}
            onClick={() => onChange(id)}
          >
            <span className="samp-dot" style={{ background: DIAGRAM_TYPE_COLORS[type] }} />
            {SAMPLES[id].label}
          </button>
        )
      })}
    </div>
  )
}
