import { useEffect, useState } from 'react'

// Touch-first devices (phones, iPads without a trackpad) get the viewer
// layout: full-screen map, source in a bottom sheet. Narrow windows count too,
// since the side-by-side split has no room below ~768px whatever the input.
// `any-hover: none` is what separates an iPad from a touchscreen laptop: the
// laptop still has a mouse, so it keeps the desktop editor.
export const MOBILE_QUERY = '(max-width: 768px), ((any-pointer: coarse) and (any-hover: none))'

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}
