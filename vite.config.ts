import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // base path for GitHub Pages — change if you serve from a different path
  base: '/TSL/',
  plugins: [react()],
  build: {
    // output to the `docs` folder so GitHub Pages can serve from `main`/`docs`
    outDir: 'docs',
  },
})
