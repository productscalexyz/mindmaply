/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Render API origin (e.g. "https://api.mindmaply.app"). Unset = share links stay hash-only. */
  readonly VITE_API_BASE?: string
  /** Share-link base for the /s/ zone route (e.g. "https://mindmaply.app"). Unset = use VITE_API_BASE. */
  readonly VITE_SHARE_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
