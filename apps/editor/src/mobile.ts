import { useEffect, useState } from 'react'

// Touch-first devices (phones, iPads without a trackpad) get the viewer
// layout: full-screen map, source in a bottom sheet. Narrow windows count too,
// since the side-by-side split has no room below ~768px whatever the input.
// `any-hover: none` is what separates an iPad from a touchscreen laptop: the
// laptop still has a mouse, so it keeps the desktop editor.
export const MOBILE_QUERY = '(max-width: 768px), ((any-pointer: coarse) and (any-hover: none))'

// Just the width half, for layout that has to agree with a CSS breakpoint
// rather than with the input device (a landscape tablet is touch but wide).
export const NARROW_QUERY = '(max-width: 768px)'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY)
}
