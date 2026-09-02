// Download helpers for exporting a rendered diagram (SVG string) to various formats.
import interRegularUrl from './fonts/Inter-Regular.ttf?url'
import interSemiBoldUrl from './fonts/Inter-SemiBold.ttf?url'

export type PngScale = 1 | 2 | 3
export type PngBackground = 'transparent' | 'white'

/** Clipboard copies are not offered a scale picker; this is what they get. */
export const COPY_IMAGE_SCALE = 3

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

// Canvas ceilings. iOS Safari is the tightest: about 16 megapixels in total,
// 8192px on a side; past that toBlob hands back null or a blank image.
const MAX_RASTER_AREA = 16_000_000
const MAX_RASTER_SIDE = 8192

/** The largest scale, at most `requested`, that keeps a width×height raster within the canvas ceilings. */
export function rasterScale(
  width: number,
  height: number,
  requested: number,
  maxArea = MAX_RASTER_AREA,
  maxSide = MAX_RASTER_SIDE,
): number {
  const byArea = Math.sqrt(maxArea / (width * height))
  const bySide = maxSide / Math.max(width, height)
  return Math.min(requested, byArea, bySide)
}

// The SVG is rasterized by loading it into an <img> from a blob URL: an
// isolated document that can neither see the page's web fonts nor fetch any
// file. Without help the PNG falls back to whatever sans-serif the OS has,
// and the node cards, sized for Inter, mis-fit their labels. So Inter (400 +
// 600, the two weights the renderer uses) goes in as @font-face data URLs.
// Fetched on demand (about 160 KB, browser-cached) since only exports need it.
async function fontFaceStyle(): Promise<string> {
  const [regular, semibold] = await Promise.all([
    fetchAsDataUrl(interRegularUrl),
    fetchAsDataUrl(interSemiBoldUrl),
  ])
  return (
    '<style>' +
    `@font-face{font-family:'Inter';font-weight:400;src:url(${regular}) format('truetype')}` +
    `@font-face{font-family:'Inter';font-weight:600;src:url(${semibold}) format('truetype')}` +
    '</style>'
  )
}

const dataUrlCache = new Map<string, Promise<string>>()

function fetchAsDataUrl(url: string): Promise<string> {
  let p = dataUrlCache.get(url)
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`font fetch failed: ${r.status}`)
        return r.blob()
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
          }),
      )
    // A failed fetch must not poison later exports (or the export itself: the
    // caller falls back to system fonts rather than refusing to render).
    p.catch(() => dataUrlCache.delete(url))
    dataUrlCache.set(url, p)
  }
  return p
}

/** Insert `style` right after the opening <svg …> tag. */
export function withEmbeddedStyle(svg: string, style: string): string {
  const i = svg.indexOf('>')
  return i === -1 ? svg : svg.slice(0, i + 1) + style + svg.slice(i + 1)
}

// Rasterize the SVG to a PNG blob on a canvas (browser-side, no server).
async function renderPngBlob(svg: string, scale: number, background: PngBackground): Promise<Blob> {
  const { width, height } = svgDimensions(svg)
  const s = rasterScale(width, height, scale)
  // No fonts is a worse picture, not a failed export.
  const src = withEmbeddedStyle(svg, await fontFaceStyle().catch(() => ''))
  const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }))

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(width * s))
        canvas.height = Math.max(1, Math.round(height * s))
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get 2D canvas context')
        if (background === 'white') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('Could not encode PNG'))
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

export async function exportPng(
  svg: string,
  filename: string,
  scale: PngScale,
  background: PngBackground,
): Promise<void> {
  downloadBlob(await renderPngBlob(svg, scale, background), filename)
}

// Copy the rendered map to the clipboard as a PNG (3x, white background: chat
// apps and docs composite transparent PNGs unpredictably). Safari only honors
// clipboard writes made inside the user gesture, so the ClipboardItem gets
// the blob PROMISE rather than the awaited blob.
export async function copyPngToClipboard(svg: string, scale: number = COPY_IMAGE_SCALE): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('Copying images is not supported in this browser')
  }
  const blob = renderPngBlob(svg, scale, 'white')
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
