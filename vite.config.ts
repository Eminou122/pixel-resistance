import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Phaser is one large library (~1.2 MB minified). It gets its own chunk, loaded only when a game starts.
    chunkSizeWarningLimit: 1400,
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
  },
})
