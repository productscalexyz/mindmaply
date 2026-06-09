// One-off generator for the OG share image, favicon.ico, and PWA/touch icon PNGs.
// NOT part of the app build — run manually only when the SVG sources change.
//
//   cd apps/editor/assets
//   curl -L -o /tmp/inter-var.ttf \
//     "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf"
//   npm i --no-save @resvg/resvg-js sharp png-to-ico
//   INTER_TTF=/tmp/inter-var.ttf node generate-images.mjs
//
// Sources (committed): og-card.svg, icon-mark.svg, ../public/favicon.svg
// Outputs (committed):  ../public/{og.png,apple-touch-icon.png,icon-192.png,
//                                   icon-512.png,favicon.ico}
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(HERE, '../public')
const fontBuf = readFileSync(process.env.INTER_TTF || '/tmp/inter-var.ttf')

function svgToPng(svgPath) {
  const resvg = new Resvg(readFileSync(svgPath, 'utf8'), {
    font: { fontBuffers: [fontBuf], defaultFontFamily: 'Inter', loadSystemFonts: false },
  })
  return resvg.render().asPng()
}

// OG share image (1200x630, native size)
writeFileSync(resolve(PUBLIC, 'og.png'), svgToPng(resolve(HERE, 'og-card.svg')))

// Touch / PWA icons: render mark at 512, downscale to exact sizes
const iconBase = svgToPng(resolve(HERE, 'icon-mark.svg'))
for (const [size, name] of [[180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  writeFileSync(resolve(PUBLIC, name), await sharp(iconBase).resize(size, size).png().toBuffer())
}

// favicon.ico (16/32/48) from the rounded favicon mark
const favBase = svgToPng(resolve(PUBLIC, 'favicon.svg'))
const icoPngs = await Promise.all([16, 32, 48].map((s) => sharp(favBase).resize(s, s).png().toBuffer()))
writeFileSync(resolve(PUBLIC, 'favicon.ico'), await pngToIco(icoPngs))

console.log('Generated og.png, apple-touch-icon.png, icon-192/512.png, favicon.ico')
