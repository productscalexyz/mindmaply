import { useState } from 'react'

interface Props {
  url: string
  onClose: () => void
}

export default function ShareModal({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false)

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
        <div className="modal-sub">
          The whole diagram is encoded in this link — anyone who opens it can view and edit it.
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
