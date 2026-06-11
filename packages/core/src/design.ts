// Design system constants — do not export mutable objects

export const CANVAS_BG = '#F4F5F7'
export const TEXT_COLOR = '#1E293B'
export const ROOT_BG = '#FFFFFF'
// Child card background — a light gray so the white root stays the focal point
export const NODE_BG = '#EEF1F4'
export const ROOT_SHADOW = '0 1px 3px rgba(0,0,0,0.1)'
export const ROOT_BORDER_RADIUS = 6
export const ROOT_PADDING_H = 16
export const ROOT_PADDING_V = 10

// Child node cards (theme.nodeStyle: 'card') — same radius/shadow as the
// root card so every node reads as the same kind of surface
export const NODE_PADDING_H = 12
export const NODE_PADDING_V = 5
export const EDGE_STROKE_WIDTH = 3.5
export const FONT_FAMILY = 'Inter, SF Pro Text, system-ui, sans-serif'
export const FONT_WEIGHT_ROOT = 600
export const FONT_WEIGHT_PRIMARY = 600   // L1 nodes
export const FONT_WEIGHT_SECONDARY = 400 // L2+ nodes
export const FONT_SIZE = 16

// Per-line-height factor for the 2nd+ lines of a multi-line label
export const EXTRA_LINE_FACTOR = 1.25

// Soft-wrap budget for node labels (px). 0 disables auto-wrapping.
export const WRAP_WIDTH = 260

// Font-size scale per depth (root, L1, L2, L3+) when theme.typography is
// 'scaled' — branch headings stay full size, leaves shrink for hierarchy.
export const TYPE_SCALE = [1, 1, 0.875, 0.8125] as const

// The 5-color branch palette — cycles in order across top-level branches
export const PALETTE = [
  '#4B96E6', // Blue
  '#B355D0', // Pink/Purple
  '#55A996', // Mint
  '#E5884B', // Orange
  '#EBB94A', // Yellow
] as const

export type PaletteColor = typeof PALETTE[number]

// Node layout sizing
export const NODE_HEIGHT = 40        // child node text line height
export const ROOT_MIN_WIDTH = 80
export const ROOT_MIN_HEIGHT = 40

// Orthogonal layout spacing
export const ORTHO_H_GAP = 100       // horizontal gap between depth levels
export const ORTHO_V_GAP = 24        // vertical gap between sibling nodes

// Curved layout spacing
export const RADIAL_RADIUS_STEP = 180 // px per depth level

// SVG canvas padding (space around the diagram content)
export const SVG_CANVAS_PADDING = 60
