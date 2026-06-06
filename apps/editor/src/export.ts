// Download helpers for exporting a rendered diagram (SVG string) to various formats.

export type PngScale = 1 | 2 | 3
export type PngBackground = 'transparent' | 'white'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSvg(svg: string, filename: string) {
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), filename)
}

export function exportSource(source: string, filename: string) {
  downloadBlob(new Blob([source], { type: 'text/plain' }), filename)
}

function svgDimensions(svg: string): { width: number; height: number } {
  const w = svg.match(/width="([\d.]+)"/)
  const h = svg.match(/height="([\d.]+)"/)
  if (w && h) return { width: Number(w[1]), height: Number(h[1]) }
  const vb = svg.match(/viewBox="([^"]+)"/)
  if (vb) {
    const parts = vb[1].trim().split(/\s+/).map(Number)
    if (parts.length === 4) return { width: parts[2], height: parts[3] }
  }
  return { width: 1024, height: 768 }
}

export function exportPng(
  svg: string,
  filename: string,
  scale: PngScale,
  background: PngBackground,
): Promise<void> {
  const { width, height } = svgDimensions(svg)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(width * scale))
        canvas.height = Math.max(1, Math.round(height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get 2D canvas context')
        if (background === 'white') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, filename)
          URL.revokeObjectURL(url)
          resolve()
        }, 'image/png')
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG for PNG export'))
    }
    img.src = url
  })
}
