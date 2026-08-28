import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
  },
  // The CLI is ESM-only (package "type" is module) and needs no type defs.
  // clean: false so it does not wipe the library build above.
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    clean: false,
  },
])
