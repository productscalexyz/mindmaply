import { useState } from 'react'

interface Props {
  /** Editor link encoding the whole diagram. */
  url: string
  /** Ready-to-paste <iframe> snippet for the chrome-less /embed view. */
  embedCode: string
  /** Optional static <img> snippet (only once the render API is live). */
  imgCode?: string | null
  onClose: () => void
}

// A labelled value + copy button. Tracks its own "Copied!" state so multiple
// rows in the same modal don't share one flag.
function CopyRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="share-field">
      <div className="share-field-label">{label}</div>
      <div className="url-row">
        {multiline ? (
          <textarea className="url-input share-code" value={value} readOnly rows={2} />
        ) : (
          <input className="url-input" value={value} readOnly />
        )}
        <button className="copy-btn" onClick={copy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

export default function ShareModal({ url, embedCode, imgCode, onClose }: Props) {
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-hd">Share diagram</div>
        <div className="modal-sub">
          The whole diagram is encoded in these links — no account or server needed.
        </div>

        <CopyRow label="Link (view &amp; edit)" value={url} />
        <CopyRow label="Embed (interactive iframe)" value={embedCode} multiline />
        {imgCode && <CopyRow label="Embed (static image)" value={imgCode} multiline />}

        <div className="modal-ft">
          <button className="m-cancel" onClick={onClose}>Cancel</button>
          <button className="m-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
