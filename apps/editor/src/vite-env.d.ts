/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Render API origin (e.g. "https://api.mindmaply.app"). Unset = share links stay hash-only. */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
