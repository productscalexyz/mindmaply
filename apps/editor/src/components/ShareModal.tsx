import { useState } from 'react'

interface Props {
  onClose: () => void
}

type ShareType = 'view' | 'edit'

export default function ShareModal({ onClose }: Props) {
  const [type, setType] = useState<ShareType>('view')
  const [copied, setCopied] = useState(false)
  const url = 'https://mindmaply.app/d/kx9p2m'

  function copyUrl() {
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-hd">Share diagram</div>
        <div className="modal-sub">Anyone with the link can access this diagram.</div>

        <div className="share-type">
          <div
            className={`st-opt${type === 'view' ? ' on' : ''}`}
            onClick={() => setType('view')}
          >
            <div className="st-title">View only</div>
            <div className="st-desc">Viewers can't edit</div>
          </div>
          <div
            className={`st-opt${type === 'edit' ? ' on' : ''}`}
            onClick={() => setType('edit')}
          >
            <div className="st-title">Can edit</div>
            <div className="st-desc">Opens in editor</div>
          </div>
        </div>

        <div className="url-row">
          <input className="url-input" value={url} readOnly />
          <button className="copy-btn" onClick={copyUrl}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="modal-ft">
          <button className="m-cancel" onClick={onClose}>Cancel</button>
          <button className="m-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
