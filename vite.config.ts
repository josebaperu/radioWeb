import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site at /radioWeb/. Local dev stays at /.
  base: command === 'build' ? '/radioWeb/' : '/',
  plugins: [react()],
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 5173, strictPort: true },
}))
