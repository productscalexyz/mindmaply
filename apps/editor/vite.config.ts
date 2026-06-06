import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: { include: ['d3-hierarchy'] },
  test: { environment: 'node' },
})
