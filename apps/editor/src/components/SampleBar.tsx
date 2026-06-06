import { SAMPLES, type SampleId } from '../samples'

const SAMPLE_IDS: SampleId[] = ['org', 'mm', 'proc']

interface Props {
  active: SampleId
  onChange: (id: SampleId) => void
}

export default function SampleBar({ active, onChange }: Props) {
  return (
    <div className="sample-bar">
      {SAMPLE_IDS.map((id) => (
        <button
          key={id}
          className={`samp-btn${active === id ? ' on' : ''}`}
          onClick={() => onChange(id)}
        >
          {SAMPLES[id].label}
        </button>
      ))}
    </div>
  )
}
